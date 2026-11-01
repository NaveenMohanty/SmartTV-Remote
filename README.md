# SmartTV Remote 📺📱

A sleek, fast, local-network open-source remote control for Android TV and Google TV devices. Built with **React Native (TypeScript)** and a high-performance **Kotlin native module**.

---

## ✨ Features

- **🔒 100% Local Network (No Cloud)**: Communicates directly with your TV over local Wi-Fi via TLS 1.3 encryption and Google's Polo pairing protocol. No third-party accounts, no tracking, and no ads.
- **⚡ Zero-Latency Control**: 0ms delay on button taps with instant single-thread command queueing.
- **🔄 Long-Press Continuous Repeating**: Just like a physical remote, hold down navigation arrows, volume, or channel rockers to smoothly repeat commands with tactile haptic feedback.
- **🚀 Customizable App Shortcuts**: 4 customizable shortcut slots with curated streaming app launchers (YouTube, Hotstar, Netflix, Prime Video, JioCinema, Spotify) or launch any installed Android TV package.
- **📱 Responsive UI**: Scales cleanly across all phone screen sizes, foldables, and tablets.
- **🎨 Vector Crisp Icons**: Uses official Material Community Icons for razor-sharp rendering on all display densities.
- **🔍 Auto-Discovery**: Finds Android TV and Google TV devices automatically on your Wi-Fi network using mDNS (`_androidtvremote2._tcp`), with manual IP fallback.
- **⏰ Wake-on-LAN (WoL)**: Powers on sleeping TVs over the local network using magic packets.

---

## 🛠️ Architecture

```
┌────────────────────────────────────────────────────────┐
│             React Native (TypeScript UI)               │
│  - DPad with Continuous Repeating (useRepeatingKey)    │
│  - ControlsCluster (Volume, Channels, Media, Hints)    │
│  - ShortcutPickerModal & DevicePickerModal             │
└───────────────────────────┬────────────────────────────┘
                            │ (React Native Bridge)
┌───────────────────────────▼────────────────────────────┐
│          Android Native Module (Kotlin)                │
│  - AndroidTvRemoteModule (Single-thread Command Queue) │
│  - PoloProtocol (Polo Pairing & Remote v2 Protocol)    │
│  - KeyStoreHelper (BouncyCastle TLS Cert Generation)   │
│  - NsdManager (mDNS _androidtvremote2._tcp Discovery)  │
└───────────────────────────┬────────────────────────────┘
                            │ (TLS Encrypted TCP Sockets)
┌───────────────────────────▼────────────────────────────┐
│      Android TV / Google TV (Ports 6466 & 6467)        │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `18.x` or higher
- **JDK**: Java 17 (`openjdk-17-jdk`)
- **Android SDK**: API level 34 (`Android 14`) with command-line tools and platform-tools (`adb`)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/smarttv-remote.git
   cd smarttv-remote
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run on connected Android device / emulator**:
   ```bash
   npm run android
   ```

---

## 📦 Building the APK

### Optimized Release APK
```bash
npm run build:release
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

### Debug APK
```bash
npm run build:debug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Install Directly to Connected Phone
```bash
npm run install:phone
```

---

## 🤝 Contributing

Contributions from the community are warmly welcomed! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on code style, testing without a physical TV, and the pull request submission process.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
