package com.androidtvremote

import android.util.Log
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.io.OutputStream
import java.security.MessageDigest
import java.security.cert.X509Certificate
import java.security.interfaces.RSAPublicKey

object PoloProtocol {
    private const val TAG = "PoloProtocol"

    const val PAIRING_PORT = 6467
    const val REMOTE_PORT = 6466

    // Polo OuterMessage tags (field_number << 3 | 2)
    val TAG_PAIRING_REQUEST = byteArrayOf(0x52.toByte())                    // Tag 10
    val TAG_PAIRING_REQUEST_ACK = byteArrayOf(0x5a.toByte())                // Tag 11
    val TAG_OPTIONS = byteArrayOf(0xa2.toByte(), 0x01.toByte())             // Tag 20
    val TAG_CONFIGURATION = byteArrayOf(0xf2.toByte(), 0x01.toByte())       // Tag 30
    val TAG_CONFIGURATION_ACK = byteArrayOf(0xfa.toByte(), 0x01.toByte())   // Tag 31
    val TAG_SECRET = byteArrayOf(0xc2.toByte(), 0x02.toByte())              // Tag 40
    val TAG_SECRET_ACK = byteArrayOf(0xca.toByte(), 0x02.toByte())          // Tag 41

    fun writeVarintBytes(value: Int): ByteArray {
        val baos = ByteArrayOutputStream()
        var v = value
        while (v and 0x7F.inv() != 0) {
            baos.write((v and 0x7F) or 0x80)
            v = v ushr 7
        }
        baos.write(v and 0x7F)
        return baos.toByteArray()
    }

    fun writeDelimited(out: OutputStream, message: ByteArray) {
        val lenBytes = writeVarintBytes(message.size)
        out.write(lenBytes)
        out.write(message)
        out.flush()
    }

    fun readDelimited(inStream: InputStream): ByteArray {
        var result = 0
        var shift = 0
        while (shift < 32) {
            val b = inStream.read()
            if (b == -1) throw Exception("Stream closed by peer")
            result = result or ((b and 0x7F) shl shift)
            if ((b and 0x80) == 0) break
            shift += 7
        }
        val len = result
        val buffer = ByteArray(len)
        var total = 0
        while (total < len) {
            val r = inStream.read(buffer, total, len - total)
            if (r == -1) throw Exception("Unexpected EOF while reading message (read $total of $len bytes)")
            total += r
        }
        return buffer
    }

    /**
     * Builds a Polo OuterMessage containing protocol_version=2, status=200, and inner request.
     */
    fun buildOuterMessage(requestTagVarint: ByteArray, payload: ByteArray): ByteArray {
        val header = byteArrayOf(
            0x08.toByte(), 0x02.toByte(),                // field 1 (protocol_version): 2
            0x10.toByte(), 0xc8.toByte(), 0x01.toByte()  // field 2 (status): 200 (STATUS_OK)
        )
        val lenBytes = writeVarintBytes(payload.size)
        return header + requestTagVarint + lenBytes + payload
    }

    /**
     * Builds inner PairingRequest message (service_name="androidtvremote", client_name="Android TV Remote").
     */
    fun buildPairingRequestPayload(serviceName: String = "androidtvremote", clientName: String = "Android TV Remote"): ByteArray {
        val sBytes = serviceName.toByteArray(Charsets.UTF_8)
        val cBytes = clientName.toByteArray(Charsets.UTF_8)
        return byteArrayOf(0x0a.toByte()) + writeVarintBytes(sBytes.size) + sBytes +
               byteArrayOf(0x12.toByte()) + writeVarintBytes(cBytes.size) + cBytes
    }

    /**
     * Builds inner Options message offering HEXADECIMAL (type 3, length 6), preferred_role=INPUT (1).
     */
    fun buildOptionsPayload(): ByteArray {
        // Encoding: type=3 (HEXADECIMAL), symbol_length=6
        val encHex = byteArrayOf(0x08.toByte(), 0x03.toByte(), 0x10.toByte(), 0x06.toByte())
        // Encoding: type=1 (ALPHANUMERIC), symbol_length=6
        val encAlpha = byteArrayOf(0x08.toByte(), 0x01.toByte(), 0x10.toByte(), 0x06.toByte())

        return byteArrayOf(0x0a.toByte()) + writeVarintBytes(encHex.size) + encHex +
               byteArrayOf(0x0a.toByte()) + writeVarintBytes(encAlpha.size) + encAlpha +
               byteArrayOf(0x18.toByte(), 0x01.toByte()) // preferred_role: 1 (ROLE_INPUT)
    }

    /**
     * Builds inner Configuration message locking in HEXADECIMAL (3, len 6) and client_role=INPUT (1).
     */
    fun buildConfigurationPayload(): ByteArray {
        val enc = byteArrayOf(
            0x08.toByte(), 0x03.toByte(), // type = 3 (HEXADECIMAL)
            0x10.toByte(), 0x06.toByte()  // symbol_length = 6
        )
        return byteArrayOf(0x0a.toByte()) + writeVarintBytes(enc.size) + enc +
               byteArrayOf(0x10.toByte(), 0x01.toByte()) // client_role = 1 (ROLE_INPUT)
    }

    fun buildConfigurationAckPayload(): ByteArray = byteArrayOf()

    fun buildSecretPayload(secretBytes: ByteArray): ByteArray {
        return byteArrayOf(0x0a.toByte()) + writeVarintBytes(secretBytes.size) + secretBytes
    }

    fun removeLeadingNullBytes(bytes: ByteArray): ByteArray {
        var i = 0
        while (i < bytes.size && bytes[i] == 0.toByte()) {
            i++
        }
        return bytes.copyOfRange(i, bytes.size)
    }

    fun hexStringToBytes(hex: String): ByteArray {
        val clean = hex.replace(" ", "").trim()
        val len = clean.length
        val data = ByteArray(len / 2)
        var i = 0
        while (i < len) {
            data[i / 2] = ((Character.digit(clean[i], 16) shl 4) + Character.digit(clean[i + 1], 16)).toByte()
            i += 2
        }
        return data
    }

    /**
     * Google Polo Challenge Response:
     * Alpha = SHA-256(clientModulus + clientExponent + serverModulus + serverExponent + nonce)
     */
    fun computePoloSecret(
        clientCert: X509Certificate,
        serverCert: X509Certificate,
        pinHex: String
    ): ByteArray {
        val cleanPin = pinHex.replace(" ", "").trim().uppercase()
        val gamma = hexStringToBytes(cleanPin)
        val nonce = if (gamma.size % 2 == 0) {
            gamma.copyOfRange(gamma.size / 2, gamma.size)
        } else {
            gamma.copyOfRange(1, gamma.size)
        }

        val clientPubKey = clientCert.publicKey as RSAPublicKey
        val serverPubKey = serverCert.publicKey as RSAPublicKey

        val clientModulus = removeLeadingNullBytes(clientPubKey.modulus.abs().toByteArray())
        val clientExponent = removeLeadingNullBytes(clientPubKey.publicExponent.abs().toByteArray())
        val serverModulus = removeLeadingNullBytes(serverPubKey.modulus.abs().toByteArray())
        val serverExponent = removeLeadingNullBytes(serverPubKey.publicExponent.abs().toByteArray())

        val digest = MessageDigest.getInstance("SHA-256")
        digest.update(clientModulus)
        digest.update(clientExponent)
        digest.update(serverModulus)
        digest.update(serverExponent)
        digest.update(nonce)
        val result = digest.digest()
        Log.d(TAG, "Polo secret computed for PIN: $cleanPin, alpha length: ${result.size}")
        return result
    }

    // --- Remote Control v2 Protocol (Port 6466) ---

    /**
     * Parses code1 from TV's incoming RemoteConfigure message (RemoteMessage field 1 -> 0x0a)
     */
    fun parseCode1FromConfigure(msg: ByteArray): Int {
        try {
            var i = 0
            while (i < msg.size) {
                val tag = msg[i].toInt() and 0xFF
                i++
                if (tag == 0x0a) { // RemoteConfigure (field 1 of RemoteMessage)
                    // Read length varint of RemoteConfigure
                    var len = 0
                    var shift = 0
                    while (i < msg.size) {
                        val b = msg[i].toInt() and 0xFF
                        i++
                        len = len or ((b and 0x7F) shl shift)
                        if ((b and 0x80) == 0) break
                        shift += 7
                    }
                    val end = i + len
                    // Inside RemoteConfigure, look for field 1: code1 (tag 0x08 = (1 << 3) | 0)
                    while (i < end && i < msg.size) {
                        val subTag = msg[i].toInt() and 0xFF
                        i++
                        if (subTag == 0x08) {
                            var code = 0
                            var s = 0
                            while (i < msg.size) {
                                val b = msg[i].toInt() and 0xFF
                                i++
                                code = code or ((b and 0x7F) shl s)
                                if ((b and 0x80) == 0) break
                                s += 7
                            }
                            return code
                        } else {
                            val wireType = subTag and 0x07
                            when (wireType) {
                                0 -> {
                                    while (i < msg.size && (msg[i].toInt() and 0x80) != 0) i++
                                    i++
                                }
                                2 -> {
                                    var subLen = 0
                                    var s = 0
                                    while (i < msg.size) {
                                        val b = msg[i].toInt() and 0xFF
                                        i++
                                        subLen = subLen or ((b and 0x7F) shl s)
                                        if ((b and 0x80) == 0) break
                                        s += 7
                                    }
                                    i += subLen
                                }
                                else -> i++
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error parsing code1: ${e.message}")
        }
        return 623 // Default fallback
    }

    /**
     * Parses val1 from TV's incoming RemotePingRequest message (field 8 -> 0x42)
     */
    fun parsePingVal1(msg: ByteArray): Int {
        try {
            if (msg.size >= 3 && (msg[0].toInt() and 0xFF) == 0x42) {
                var i = 2
                while (i < msg.size) {
                    val tag = msg[i].toInt() and 0xFF
                    i++
                    if (tag == 0x08 && i < msg.size) {
                        return msg[i].toInt() and 0x7F
                    }
                }
            }
        } catch (_: Exception) {}
        return 1
    }

    /**
     * Builds RemoteConfigure packet:
     * RemoteMessage { remote_configure (field 1) { code1: activeCode, device_info (field 2) { ... } } }
     */
    fun buildRemoteConfigurePacket(code1: Int = 622): ByteArray {
        val unknown1 = byteArrayOf(0x18.toByte(), 0x01.toByte()) // field 3 = 1
        val unknown2 = byteArrayOf(0x22.toByte(), 0x01.toByte(), 0x31.toByte()) // field 4 = "1"

        val pkg = "atvremote".toByteArray(Charsets.UTF_8)
        val pkgField = byteArrayOf(0x2a.toByte()) + writeVarintBytes(pkg.size) + pkg // field 5

        val ver = "1.0.0".toByteArray(Charsets.UTF_8)
        val verField = byteArrayOf(0x32.toByte()) + writeVarintBytes(ver.size) + ver // field 6

        val devInfoPayload = unknown1 + unknown2 + pkgField + verField
        val devInfoField = byteArrayOf(0x12.toByte()) + writeVarintBytes(devInfoPayload.size) + devInfoPayload

        val code1Field = byteArrayOf(0x08.toByte()) + writeVarintBytes(code1)
        val configurePayload = code1Field + devInfoField

        return byteArrayOf(0x0a.toByte()) + writeVarintBytes(configurePayload.size) + configurePayload
    }

    /**
     * Builds RemoteSetActive packet:
     * RemoteMessage { remote_set_active (field 2) { active: activeCode } }
     */
    fun buildRemoteSetActivePacket(active: Int = 622): ByteArray {
        val setActivePayload = byteArrayOf(0x08.toByte()) + writeVarintBytes(active)
        return byteArrayOf(0x12.toByte()) + writeVarintBytes(setActivePayload.size) + setActivePayload
    }

    /**
     * Builds RemoteKeyInject packet:
     * RemoteMessage { remote_key_inject (field 10 = 0x52) { key_code (field 1), direction (field 2 = 3: SHORT) } }
     */
    fun buildKeyInjectPacket(keyCode: Int, direction: Int = 3): ByteArray {
        val keyInjectBody = byteArrayOf(0x08.toByte()) + writeVarintBytes(keyCode) +
                             byteArrayOf(0x10.toByte(), direction.toByte())
        return byteArrayOf(0x52.toByte()) + writeVarintBytes(keyInjectBody.size) + keyInjectBody
    }

    /**
     * Builds RemotePingRequest packet:
     * RemoteMessage { remote_ping_request (field 8 = 0x42) { val1 (field 1): 1 } }
     */
    fun buildPingPacket(): ByteArray {
        val pingBody = byteArrayOf(0x08.toByte(), 0x01.toByte())
        return byteArrayOf(0x42.toByte()) + writeVarintBytes(pingBody.size) + pingBody
    }

    /**
     * Builds RemotePingResponse packet:
     * RemoteMessage { remote_ping_response (field 9 = 0x4a) { val1 (field 1): 1 } }
     */
    fun buildPingResponsePacket(val1: Int = 1): ByteArray {
        val pingBody = byteArrayOf(0x08.toByte()) + writeVarintBytes(val1)
        return byteArrayOf(0x4a.toByte()) + writeVarintBytes(pingBody.size) + pingBody
    }

    /**
     * Builds RemoteAppLinkLaunchRequest packet:
     * RemoteMessage { remote_app_link_launch_request (field 90 = 0xd2, 0x05) { app_link (field 1) } }
     */
    fun buildAppLinkPacket(appUrl: String): ByteArray {
        val urlBytes = appUrl.toByteArray(Charsets.UTF_8)
        val body = byteArrayOf(0x0a.toByte()) + writeVarintBytes(urlBytes.size) + urlBytes
        val tag = byteArrayOf(0xd2.toByte(), 0x05.toByte())
        return tag + writeVarintBytes(body.size) + body
    }
}
