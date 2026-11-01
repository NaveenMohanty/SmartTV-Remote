package com.androidtvremote

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.net.wifi.WifiManager
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.InputStream
import java.io.OutputStream
import java.io.ByteArrayOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.SocketTimeoutException
import java.net.ConnectException
import java.net.NoRouteToHostException
import java.security.cert.X509Certificate
import javax.net.ssl.SSLException
import javax.net.ssl.SSLSocket
import kotlin.concurrent.thread

class AndroidTvRemoteModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "AndroidTvRemote"
        private const val PREFS_MACS = "atv_remote_macs"
        private const val PREFS_SHORTCUTS = "atv_remote_shortcuts"
        private const val KEY_CUSTOM_SHORTCUTS = "custom_shortcuts"
    }

    override fun getName(): String = "AndroidTvRemote"

    private val nsdManager by lazy {
        reactContext.getSystemService(Context.NSD_SERVICE) as NsdManager
    }

    private val wifiManager by lazy {
        reactContext.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
    }

    private var multicastLock: WifiManager.MulticastLock? = null
    private var isDiscovering = false
    private var discoveryListener: NsdManager.DiscoveryListener? = null

    // Sockets and Synchronization
    private val writeLock = Any()
    private val commandExecutor = java.util.concurrent.Executors.newSingleThreadExecutor()
    private var pairingSocket: SSLSocket? = null
    private var remoteSocket: SSLSocket? = null
    private var remoteOut: OutputStream? = null
    private var remoteIn: InputStream? = null
    private var isConnected = false
    private var activeFeaturesCode = 623
    private var readerThread: Thread? = null

    private var currentTvIp: String? = null
    private var currentServerCert: X509Certificate? = null

    private fun sendEvent(eventName: String, params: WritableMap?) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (e: Exception) {
            Log.e(TAG, "Error emitting event $eventName: ${e.message}")
        }
    }

    private fun saveMacAddress(ip: String, dn: String?) {
        if (dn == null) return
        try {
            // Extracts MAC like EC:FA:5C:8D:43:3B from CN=atvremote/EC:FA:5C:8D:43:3B
            val macRegex = Regex("([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})")
            val match = macRegex.find(dn)
            if (match != null) {
                val mac = match.value.uppercase()
                reactContext.getSharedPreferences(PREFS_MACS, Context.MODE_PRIVATE)
                    .edit()
                    .putString(ip, mac)
                    .apply()
                Log.d(TAG, "Saved MAC address for $ip: $mac")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error saving MAC address: ${e.message}")
        }
    }

    private fun getSavedMac(ip: String?): String? {
        if (ip == null) return null
        return reactContext.getSharedPreferences(PREFS_MACS, Context.MODE_PRIVATE)
            .getString(ip, null)
    }

    @ReactMethod
    fun wakeDevice(mac: String?, ip: String?) {
        thread(name = "WakeOnLanThread") {
            try {
                val targetMac = mac ?: getSavedMac(ip ?: currentTvIp)
                if (targetMac == null) {
                    Log.w(TAG, "Wake-on-LAN: No MAC address known for ${ip ?: currentTvIp}")
                    return@thread
                }

                val cleanMac = targetMac.replace(":", "").replace("-", "").trim()
                if (cleanMac.length != 12) {
                    Log.w(TAG, "Wake-on-LAN: Invalid MAC address: $cleanMac")
                    return@thread
                }

                val macBytes = ByteArray(6)
                for (i in 0 until 6) {
                    macBytes[i] = cleanMac.substring(i * 2, i * 2 + 2).toInt(16).toByte()
                }

                // WoL Magic Packet: 6 bytes of 0xFF followed by MAC repeated 16 times
                val packetBytes = ByteArray(6 + 16 * 6)
                for (i in 0 until 6) {
                    packetBytes[i] = 0xFF.toByte()
                }
                for (i in 0 until 16) {
                    System.arraycopy(macBytes, 0, packetBytes, 6 + i * 6, 6)
                }

                val broadcastAddr = InetAddress.getByName("255.255.255.255")
                val datagram = DatagramPacket(packetBytes, packetBytes.size, broadcastAddr, 9)
                DatagramSocket().use { socket ->
                    socket.broadcast = true
                    socket.send(datagram)
                }
                Log.d(TAG, "Sent Wake-on-LAN magic packet to 255.255.255.255:9 for $cleanMac")
            } catch (e: Exception) {
                Log.w(TAG, "Failed to send Wake-on-LAN packet: ${e.message}")
            }
        }
    }

    @ReactMethod
    fun startDiscovery() {
        if (isDiscovering) return

        try {
            if (multicastLock == null) {
                multicastLock = wifiManager.createMulticastLock("atv_remote_mdns_lock").apply {
                    setReferenceCounted(true)
                }
            }
            multicastLock?.acquire()

            discoveryListener = object : NsdManager.DiscoveryListener {
                override fun onStartDiscoveryFailed(serviceType: String?, errorCode: Int) {
                    Log.e(TAG, "Discovery failed to start: $errorCode")
                    isDiscovering = false
                    val err = Arguments.createMap().apply {
                        putString("code", "DISCOVERY_ERROR")
                        putString("message", "Unable to start Wi-Fi discovery (Error $errorCode)")
                    }
                    sendEvent("onError", err)
                }

                override fun onStopDiscoveryFailed(serviceType: String?, errorCode: Int) {
                    isDiscovering = false
                }

                override fun onDiscoveryStarted(serviceType: String?) {
                    Log.d(TAG, "mDNS Discovery started for $serviceType")
                    isDiscovering = true
                    val params = Arguments.createMap().apply { putString("state", "SCANNING") }
                    sendEvent("onStateChanged", params)
                }

                override fun onDiscoveryStopped(serviceType: String?) {
                    isDiscovering = false
                }

                override fun onServiceFound(serviceInfo: NsdServiceInfo) {
                    Log.d(TAG, "Service found: ${serviceInfo.serviceName} (${serviceInfo.serviceType})")
                    if (serviceInfo.serviceType.contains("androidtvremote2") ||
                        serviceInfo.serviceType.contains("androidtvremote")
                    ) {
                        nsdManager.resolveService(serviceInfo, object : NsdManager.ResolveListener {
                            override fun onResolveFailed(serviceInfo: NsdServiceInfo?, errorCode: Int) {
                                Log.w(TAG, "Resolve failed for ${serviceInfo?.serviceName}: $errorCode")
                            }

                            override fun onServiceResolved(resolved: NsdServiceInfo) {
                                val host = resolved.host?.hostAddress ?: return
                                val port = resolved.port
                                Log.d(TAG, "Resolved service: ${resolved.serviceName} at $host:$port")

                                val map = Arguments.createMap().apply {
                                    putString("id", host)
                                    putString("name", resolved.serviceName.replace("\\032", " "))
                                    putString("ip", host)
                                    putInt("port", port)
                                    putString("mac", getSavedMac(host))
                                }
                                sendEvent("onDeviceDiscovered", map)
                            }
                        })
                    }
                }

                override fun onServiceLost(serviceInfo: NsdServiceInfo?) {}
            }

            nsdManager.discoverServices(
                "_androidtvremote2._tcp",
                NsdManager.PROTOCOL_DNS_SD,
                discoveryListener
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error starting discovery", e)
            val err = Arguments.createMap().apply {
                putString("code", "DISCOVERY_ERROR")
                putString("message", "Network error starting scan: ${e.localizedMessage}")
            }
            sendEvent("onError", err)
        }
    }

    @ReactMethod
    fun stopDiscovery() {
        if (isDiscovering && discoveryListener != null) {
            try {
                nsdManager.stopServiceDiscovery(discoveryListener)
            } catch (_: Exception) {}
            isDiscovering = false
        }
        if (multicastLock?.isHeld == true) {
            try { multicastLock?.release() } catch (_: Exception) {}
        }
    }

    @ReactMethod
    fun startPairing(ip: String, port: Int) {
        currentTvIp = ip
        thread(name = "PairingThread") {
            try {
                Log.d(TAG, "Initiating pairing sequence to $ip:$port...")
                val (keyPair, clientCert) = SslHelper.getOrCreateClientCredentials(reactContext)
                val sslContext = SslHelper.createSslContext(keyPair, clientCert)

                val targetPort = if (port == 6466) PoloProtocol.PAIRING_PORT else port
                val socket = sslContext.socketFactory.createSocket() as SSLSocket
                socket.soTimeout = 12000
                socket.connect(InetSocketAddress(ip, targetPort), 4000)
                socket.startHandshake()

                pairingSocket = socket
                val session = socket.session
                currentServerCert = session.peerCertificates.firstOrNull() as? X509Certificate
                saveMacAddress(ip, currentServerCert?.subjectDN?.name)
                Log.d(TAG, "SSL Handshake succeeded with server: ${currentServerCert?.subjectDN}")

                val out = socket.outputStream
                val inStream = socket.inputStream

                // 1. Send PairingRequest
                Log.d(TAG, "Step 1: Sending PairingRequest...")
                val reqMsg = PoloProtocol.buildOuterMessage(
                    PoloProtocol.TAG_PAIRING_REQUEST,
                    PoloProtocol.buildPairingRequestPayload()
                )
                PoloProtocol.writeDelimited(out, reqMsg)

                // 2. Read PairingRequestAck
                Log.d(TAG, "Step 2: Waiting for PairingRequestAck...")
                val reqAck = PoloProtocol.readDelimited(inStream)
                Log.d(TAG, "Received PairingRequestAck (${reqAck.size} bytes)")

                // 3. Send Options
                Log.d(TAG, "Step 3: Sending Options...")
                val optMsg = PoloProtocol.buildOuterMessage(
                    PoloProtocol.TAG_OPTIONS,
                    PoloProtocol.buildOptionsPayload()
                )
                PoloProtocol.writeDelimited(out, optMsg)

                // 4. Read TV's Options
                Log.d(TAG, "Step 4: Waiting for Server Options...")
                val serverOpt = PoloProtocol.readDelimited(inStream)
                Log.d(TAG, "Received Server Options (${serverOpt.size} bytes)")

                // 5. Send Configuration
                Log.d(TAG, "Step 5: Sending Configuration...")
                val cfgMsg = PoloProtocol.buildOuterMessage(
                    PoloProtocol.TAG_CONFIGURATION,
                    PoloProtocol.buildConfigurationPayload()
                )
                PoloProtocol.writeDelimited(out, cfgMsg)

                // 6. Read ConfigurationAck
                Log.d(TAG, "Step 6: Waiting for ConfigurationAck...")
                val cfgAck = PoloProtocol.readDelimited(inStream)
                Log.d(TAG, "Received ConfigurationAck (${cfgAck.size} bytes)")

                // 7. TV is now displaying PIN on screen!
                Log.d(TAG, "Step 7: TV is now displaying PIN on screen! Notifying UI...")
                val reqMap = Arguments.createMap().apply { putString("ip", ip) }
                sendEvent("onPairingRequested", reqMap)

            } catch (e: Exception) {
                Log.e(TAG, "Pairing handshake failed: ${e.message}", e)
                try { pairingSocket?.close() } catch (_: Exception) {}
                pairingSocket = null

                if (e is SocketTimeoutException || e is ConnectException || e is NoRouteToHostException) {
                    val err = Arguments.createMap().apply {
                        putString("code", "TV_OFFLINE")
                        putString("message", "TV is offline or unreachable at $ip. Make sure the TV is turned on and on the same Wi-Fi.")
                        putString("ip", ip)
                    }
                    sendEvent("onError", err)
                    val stateMap = Arguments.createMap().apply { putString("state", "DISCONNECTED") }
                    sendEvent("onStateChanged", stateMap)
                } else {
                    // Try direct remote control port 6466 if already paired
                    Log.d(TAG, "Attempting direct remote connection to port 6466...")
                    connect(ip, PoloProtocol.REMOTE_PORT)
                }
            }
        }
    }

    @ReactMethod
    fun sendPairingPin(pin: String) {
        thread(name = "SecretThread") {
            try {
                Log.d(TAG, "Step 8: Processing user entered PIN: $pin")
                val socket = pairingSocket ?: throw Exception("Pairing session expired or not active")
                val out = socket.outputStream
                val inStream = socket.inputStream

                val (_, clientCert) = SslHelper.getOrCreateClientCredentials(reactContext)
                val serverCert = currentServerCert ?: throw Exception("Server certificate missing")

                val secretBytes = PoloProtocol.computePoloSecret(clientCert, serverCert, pin)

                Log.d(TAG, "Sending Secret message (${secretBytes.size} bytes)...")
                val secretMsg = PoloProtocol.buildOuterMessage(
                    PoloProtocol.TAG_SECRET,
                    PoloProtocol.buildSecretPayload(secretBytes)
                )
                PoloProtocol.writeDelimited(out, secretMsg)

                Log.d(TAG, "Waiting for SecretAck...")
                val secretAck = PoloProtocol.readDelimited(inStream)
                Log.d(TAG, "Received SecretAck (${secretAck.size} bytes) - Pairing successful!")

                socket.close()
                pairingSocket = null

                // Once paired successfully, immediately connect to remote control port 6466
                currentTvIp?.let { ip ->
                    connect(ip, PoloProtocol.REMOTE_PORT)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Pairing failed: ${e.message}", e)
                val err = Arguments.createMap().apply {
                    putString("code", "INVALID_PIN")
                    putString("message", "Incorrect or expired PIN code. Please check the code shown on your TV.")
                    putString("ip", currentTvIp)
                }
                sendEvent("onError", err)
            }
        }
    }

    @ReactMethod
    fun connect(ip: String, port: Int) {
        thread(name = "RemoteConnectThread") {
            val wasConnected = isConnected
            try {
                disconnectInternal()

                val stateConnecting = Arguments.createMap().apply { putString("state", "CONNECTING") }
                sendEvent("onStateChanged", stateConnecting)

                Log.d(TAG, "Connecting to Remote service on $ip:$port...")
                val (keyPair, clientCert) = SslHelper.getOrCreateClientCredentials(reactContext)
                val sslContext = SslHelper.createSslContext(keyPair, clientCert)

                val targetPort = if (port == PoloProtocol.PAIRING_PORT) PoloProtocol.REMOTE_PORT else port
                val socket = sslContext.socketFactory.createSocket() as SSLSocket
                socket.soTimeout = 8000
                socket.connect(InetSocketAddress(ip, targetPort), 3500) // 3.5s connect timeout
                socket.startHandshake()

                remoteSocket = socket
                remoteOut = socket.outputStream
                remoteIn = socket.inputStream
                currentTvIp = ip

                val session = socket.session
                val serverCert = session.peerCertificates.firstOrNull() as? X509Certificate
                saveMacAddress(ip, serverCert?.subjectDN?.name)

                Log.d(TAG, "SSL Handshake succeeded on port $targetPort. Waiting for TV RemoteConfigure...")

                // Step 1: Wait for TV's initial RemoteConfigure message
                val tvMsg = PoloProtocol.readDelimited(remoteIn!!)
                val tvCode1 = PoloProtocol.parseCode1FromConfigure(tvMsg)
                activeFeaturesCode = if (tvCode1 != 0) (tvCode1 and 623) else 622
                Log.d(TAG, "Received TV RemoteConfigure: tvCode1=$tvCode1, selected activeCode=$activeFeaturesCode")

                // Step 2: Send Client RemoteConfigure packet
                Log.d(TAG, "Sending client RemoteConfigure packet (code1=$activeFeaturesCode)...")
                val clientConfig = PoloProtocol.buildRemoteConfigurePacket(activeFeaturesCode)
                synchronized(writeLock) {
                    PoloProtocol.writeDelimited(remoteOut!!, clientConfig)
                }

                // Step 3: Read TV's next message (typically RemoteSetActive or RemoteStart)
                val tvMsg2 = PoloProtocol.readDelimited(remoteIn!!)
                val tag2 = tvMsg2.getOrNull(0)?.toInt()?.and(0xFF) ?: 0
                Log.d(TAG, "Received TV message 2: tag=0x${Integer.toHexString(tag2)} (${tvMsg2.size} bytes)")

                if (tag2 == 0x12) { // RemoteSetActive
                    Log.d(TAG, "Sending client RemoteSetActive packet (active=$activeFeaturesCode)...")
                    val setActive = PoloProtocol.buildRemoteSetActivePacket(activeFeaturesCode)
                    synchronized(writeLock) {
                        PoloProtocol.writeDelimited(remoteOut!!, setActive)
                    }
                }

                // Session established!
                socket.soTimeout = 0 // Remote control socket stays open indefinitely
                isConnected = true
                Log.d(TAG, "Remote service CONNECTED and ACTIVE! Emitting CONNECTED state...")

                val stateMap = Arguments.createMap().apply { putString("state", "CONNECTED") }
                sendEvent("onStateChanged", stateMap)

                // Start background reader thread (handles TV ping requests & responses)
                startReaderLoop()

            } catch (e: Exception) {
                Log.e(TAG, "Remote connection failed: ${e.message}", e)
                disconnectInternal()

                // Categorize error cleanly
                val errorCode: String
                val friendlyMessage: String

                when (e) {
                    is SocketTimeoutException, is ConnectException, is NoRouteToHostException -> {
                        errorCode = "TV_OFFLINE"
                        friendlyMessage = "TV is offline or unreachable at $ip. Make sure the TV is turned on and on the same Wi-Fi."
                    }
                    is SSLException -> {
                        if (e.message?.contains("handshake", ignoreCase = true) == true ||
                            e.message?.contains("certificate", ignoreCase = true) == true
                        ) {
                            Log.d(TAG, "Certificate rejected or untrusted. Falling back to pairing on port 6467...")
                            startPairing(ip, PoloProtocol.PAIRING_PORT)
                            return@thread
                        } else {
                            errorCode = "CONNECTION_FAILED"
                            friendlyMessage = "Secure connection failed. Please try reconnecting."
                        }
                    }
                    else -> {
                        errorCode = "CONNECTION_FAILED"
                        friendlyMessage = if (e.message?.contains("Stream closed", ignoreCase = true) == true) {
                            "TV connection closed."
                        } else {
                            "Unable to connect to TV at $ip. Check Wi-Fi connection."
                        }
                    }
                }

                val err = Arguments.createMap().apply {
                    putString("code", errorCode)
                    putString("message", friendlyMessage)
                    putString("ip", ip)
                }
                sendEvent("onError", err)

                val stateMap = Arguments.createMap().apply { putString("state", "DISCONNECTED") }
                sendEvent("onStateChanged", stateMap)
            }
        }
    }

    private fun startReaderLoop() {
        readerThread?.interrupt()
        readerThread = thread(name = "RemoteReaderThread") {
            try {
                val input = remoteIn ?: return@thread
                while (isConnected) {
                    val msg = PoloProtocol.readDelimited(input)
                    if (msg.isEmpty()) continue

                    val tag = msg[0].toInt() and 0xFF
                    when (tag) {
                        0x42 -> {
                            // RemotePingRequest from TV: reply with RemotePingResponse
                            val val1 = PoloProtocol.parsePingVal1(msg)
                            val pingResp = PoloProtocol.buildPingResponsePacket(val1)
                            remoteOut?.let { out ->
                                synchronized(writeLock) {
                                    PoloProtocol.writeDelimited(out, pingResp)
                                }
                            }
                            Log.d(TAG, "Answered TV PingRequest (val1=$val1)")
                        }
                        0x12 -> {
                            // RemoteSetActive: reply with RemoteSetActive
                            val setActive = PoloProtocol.buildRemoteSetActivePacket(activeFeaturesCode)
                            remoteOut?.let { out ->
                                synchronized(writeLock) {
                                    PoloProtocol.writeDelimited(out, setActive)
                                }
                            }
                            Log.d(TAG, "Replied to TV RemoteSetActive")
                        }
                        0x0a -> {
                            // RemoteConfigure re-negotiation
                            val config = PoloProtocol.buildRemoteConfigurePacket(activeFeaturesCode)
                            remoteOut?.let { out ->
                                synchronized(writeLock) {
                                    PoloProtocol.writeDelimited(out, config)
                                }
                            }
                            Log.d(TAG, "Replied to TV RemoteConfigure")
                        }
                        0x1a -> {
                            Log.w(TAG, "Received RemoteError from TV")
                        }
                        else -> {
                            if (msg.size >= 2 && tag == 0xc2 && (msg[1].toInt() and 0xFF) == 0x02) {
                                Log.d(TAG, "TV sent RemoteStart (started=true)")
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                if (isConnected) {
                    Log.w(TAG, "Reader loop ended: ${e.message}")
                    disconnectInternal()
                    val stateMap = Arguments.createMap().apply { putString("state", "DISCONNECTED") }
                    sendEvent("onStateChanged", stateMap)

                    val err = Arguments.createMap().apply {
                        putString("code", "CONNECTION_LOST")
                        putString("message", "Connection to TV was disconnected.")
                        putString("ip", currentTvIp)
                    }
                    sendEvent("onError", err)
                }
            }
        }
    }

    @ReactMethod
    fun sendKey(keyCode: Int, direction: String?) {
        val ip = currentTvIp
        if (!isConnected || remoteOut == null) {
            Log.w(TAG, "sendKey called while disconnected. Attempting auto-reconnect to $ip...")
            if (ip != null) {
                connect(ip, PoloProtocol.REMOTE_PORT)
            }
            return
        }

        commandExecutor.execute {
            try {
                // RemoteDirection enum: SHORT = 3, START_LONG = 1, END_LONG = 2
                val dirCode = when (direction) {
                    "START" -> 1
                    "END" -> 2
                    else -> 3 // Standard SHORT click
                }
                Log.d(TAG, "Sending key $keyCode (direction $dirCode)...")
                val packet = PoloProtocol.buildKeyInjectPacket(keyCode, dirCode)
                remoteOut?.let { out ->
                    synchronized(writeLock) {
                        PoloProtocol.writeDelimited(out, packet)
                    }
                }
                Log.d(TAG, "Key $keyCode sent successfully!")
            } catch (e: Exception) {
                Log.e(TAG, "sendKey failed: ${e.message}", e)
                disconnectInternal()
                val stateMap = Arguments.createMap().apply { putString("state", "DISCONNECTED") }
                sendEvent("onStateChanged", stateMap)

                val err = Arguments.createMap().apply {
                    putString("code", "CONNECTION_LOST")
                    putString("message", "Connection lost while sending command.")
                    putString("ip", currentTvIp)
                }
                sendEvent("onError", err)
            }
        }
    }

    @ReactMethod
    fun sendText(text: String) {
        if (!isConnected || remoteOut == null) return
        thread(name = "SendTextThread") {
            try {
                for (ch in text) {
                    val code = when (ch) {
                        ' ' -> 62 // KEYCODE_SPACE
                        '\n' -> 66 // KEYCODE_ENTER
                        in '0'..'9' -> 7 + (ch - '0') // KEYCODE_0 .. KEYCODE_9
                        in 'a'..'z' -> 29 + (ch - 'a') // KEYCODE_A .. KEYCODE_Z
                        in 'A'..'Z' -> 29 + (ch - 'A')
                        else -> 0
                    }
                    if (code > 0) {
                        val packet = PoloProtocol.buildKeyInjectPacket(code, 3)
                        remoteOut?.let { out ->
                            synchronized(writeLock) {
                                PoloProtocol.writeDelimited(out, packet)
                            }
                        }
                        Thread.sleep(40)
                    }
                }
            } catch (_: Exception) {}
        }
    }

    @ReactMethod
    fun saveShortcuts(json: String, promise: Promise) {
        try {
            reactContext.getSharedPreferences(PREFS_SHORTCUTS, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_CUSTOM_SHORTCUTS, json)
                .apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SAVE_FAILED", e.message)
        }
    }

    @ReactMethod
    fun getSavedShortcuts(promise: Promise) {
        try {
            val json = reactContext.getSharedPreferences(PREFS_SHORTCUTS, Context.MODE_PRIVATE)
                .getString(KEY_CUSTOM_SHORTCUTS, null)
            promise.resolve(json)
        } catch (e: Exception) {
            promise.reject("LOAD_FAILED", e.message)
        }
    }

    @ReactMethod
    fun launchApp(appId: String) {
        val ip = currentTvIp
        if (!isConnected || remoteOut == null) {
            Log.w(TAG, "launchApp called while disconnected.")
            if (ip != null) connect(ip, PoloProtocol.REMOTE_PORT)
            return
        }

        thread(name = "LaunchAppThread") {
            try {
                val clean = appId.trim()
                val url = when (clean.lowercase()) {
                    "youtube" -> "https://www.youtube.com"
                    "hotstar", "jiohotstar" -> "https://www.hotstar.com"
                    "netflix" -> "https://www.netflix.com"
                    "prime", "primevideo", "prime_video" -> "https://app.primevideo.com"
                    "jiocinema" -> "https://www.jiocinema.com"
                    "spotify" -> "spotify://"
                    "zee5" -> "https://www.zee5.com"
                    "sonyliv" -> "https://www.sonyliv.com"
                    "appletv", "apple_tv" -> "https://tv.apple.com"
                    "disney", "disneyplus" -> "https://www.disneyplus.com"
                    "plex" -> "plex://"
                    "kodi" -> "market://launch?id=org.xbmc.kodi"
                    "vlc" -> "market://launch?id=org.videolan.vlc"
                    "smarttube" -> "market://launch?id=com.teamsmart.videomanager.tv"
                    else -> {
                        if (clean.contains("://")) {
                            clean
                        } else {
                            "market://launch?id=$clean"
                        }
                    }
                }

                Log.d(TAG, "Launching TV app URL: $url")
                val packet = PoloProtocol.buildAppLinkPacket(url)
                remoteOut?.let { out ->
                    synchronized(writeLock) {
                        PoloProtocol.writeDelimited(out, packet)
                    }
                }
                Log.d(TAG, "App launched successfully: $appId ($url)")
            } catch (e: Exception) {
                Log.e(TAG, "launchApp failed for $appId: ${e.message}", e)
            }
        }
    }

    private fun disconnectInternal() {
        isConnected = false
        readerThread?.interrupt()
        try { remoteSocket?.close() } catch (_: Exception) {}
        try { pairingSocket?.close() } catch (_: Exception) {}
        remoteSocket = null
        pairingSocket = null
        remoteOut = null
        remoteIn = null
        readerThread = null
    }

    @ReactMethod
    fun disconnect() {
        disconnectInternal()
        val stateMap = Arguments.createMap().apply { putString("state", "DISCONNECTED") }
        sendEvent("onStateChanged", stateMap)
    }
}
