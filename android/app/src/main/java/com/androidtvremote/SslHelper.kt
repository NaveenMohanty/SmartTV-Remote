package com.androidtvremote

import android.content.Context
import android.util.Base64
import org.bouncycastle.asn1.x500.X500Name
import org.bouncycastle.asn1.x509.SubjectPublicKeyInfo
import org.bouncycastle.cert.X509v3CertificateBuilder
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder
import java.io.ByteArrayInputStream
import java.math.BigInteger
import java.security.*
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec
import java.util.*
import javax.net.ssl.*

object SslHelper {
    // Custom TrustManager that accepts TV self-signed certificates
    val trustAllManager = arrayOf<TrustManager>(object : X509TrustManager {
        override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
        override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
        override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
    })

    fun createSslContext(keyPair: KeyPair, cert: X509Certificate): SSLContext {
        val keyStore = KeyStore.getInstance(KeyStore.getDefaultType()).apply {
            load(null, null)
            setKeyEntry("client", keyPair.private, "password".toCharArray(), arrayOf(cert))
            setCertificateEntry("cert", cert)
        }

        val kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm()).apply {
            init(keyStore, "password".toCharArray())
        }

        return SSLContext.getInstance("TLSv1.2").apply {
            init(kmf.keyManagers, trustAllManager, SecureRandom())
        }
    }

    fun generateRsaKeyPair(): KeyPair {
        val kpg = KeyPairGenerator.getInstance("RSA")
        kpg.initialize(2048)
        return kpg.generateKeyPair()
    }

    fun generateSelfSignedCert(keyPair: KeyPair): X509Certificate {
        val now = System.currentTimeMillis()
        val notBefore = Date(now - 1000L * 60 * 60 * 24) // 1 day ago
        val notAfter = Date(now + 1000L * 60 * 60 * 24 * 365 * 10) // 10 years valid
        val serial = BigInteger(64, SecureRandom())
        val name = X500Name("CN=atvremote-app")
        val subPubKeyInfo = SubjectPublicKeyInfo.getInstance(keyPair.public.encoded)

        val certBuilder = X509v3CertificateBuilder(
            name,
            serial,
            notBefore,
            notAfter,
            name,
            subPubKeyInfo
        )

        val signer = JcaContentSignerBuilder("SHA256WithRSA").build(keyPair.private)
        val holder = certBuilder.build(signer)
        val certFactory = CertificateFactory.getInstance("X.509")
        return certFactory.generateCertificate(ByteArrayInputStream(holder.encoded)) as X509Certificate
    }

    fun getOrCreateClientCredentials(context: Context): Pair<KeyPair, X509Certificate> {
        val prefs = context.getSharedPreferences("atv_remote_ssl", Context.MODE_PRIVATE)
        val privateKeyBase64 = prefs.getString("private_key", null)
        val publicKeyBase64 = prefs.getString("public_key", null)
        val certBase64 = prefs.getString("cert", null)

        if (privateKeyBase64 != null && publicKeyBase64 != null && certBase64 != null) {
            try {
                val kf = KeyFactory.getInstance("RSA")
                val pubSpec = X509EncodedKeySpec(Base64.decode(publicKeyBase64, Base64.DEFAULT))
                val privSpec = PKCS8EncodedKeySpec(Base64.decode(privateKeyBase64, Base64.DEFAULT))
                val pubKey = kf.generatePublic(pubSpec)
                val privKey = kf.generatePrivate(privSpec)

                val cf = CertificateFactory.getInstance("X.509")
                val certBytes = Base64.decode(certBase64, Base64.DEFAULT)
                val cert = cf.generateCertificate(ByteArrayInputStream(certBytes)) as X509Certificate

                return Pair(KeyPair(pubKey, privKey), cert)
            } catch (e: Exception) {
                // If corrupted, clear and regenerate
                prefs.edit().clear().apply()
            }
        }

        val pair = generateRsaKeyPair()
        val cert = generateSelfSignedCert(pair)

        prefs.edit()
            .putString("private_key", Base64.encodeToString(pair.private.encoded, Base64.DEFAULT))
            .putString("public_key", Base64.encodeToString(pair.public.encoded, Base64.DEFAULT))
            .putString("cert", Base64.encodeToString(cert.encoded, Base64.DEFAULT))
            .apply()

        return Pair(pair, cert)
    }
}
