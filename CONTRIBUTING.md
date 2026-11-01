# Contributing to SmartTV Remote 🤝

Thank you for your interest in contributing to **SmartTV Remote**! This guide will help you get set up, understand our code structure, and submit pull requests cleanly.

---

## 🛠️ Development Setup

1. **Prerequisites**:
   - Node.js 18+ and npm
   - JDK 17 (OpenJDK 17)
   - Android SDK (API level 34) with `platform-tools` (`adb`) in your `PATH`

2. **Clone & Install**:
   ```bash
   git clone https://github.com/<your-username>/smarttv-remote.git
   cd smarttv-remote
   npm install
   ```

3. **Verify Type-Safety**:
   ```bash
   npx tsc --noEmit
   ```

---

## 📺 Testing Without a Physical TV

If you don't have a physical Android TV on your local network:
1. Open **Android Studio** -> **Virtual Device Manager**.
2. Create an **Android TV (1080p)** or **Google TV** virtual device.
3. Start the emulator.
4. The emulator will appear in ADB and support TCP port forwarding:
   ```bash
   adb forward tcp:6466 tcp:6466
   adb forward tcp:6467 tcp:6467
   ```
5. You can pair and test the remote interface directly with the emulator.

---

## 📁 Project Structure

```
├── src/
│   ├── components/         # React Native UI components
│   │   ├── ControlsCluster # Rockers, volume, channel, media buttons
│   │   ├── DPad            # 5-way navigation directional pad
│   │   ├── Header          # Power button, status pill, device switch
│   │   ├── DevicePickerModal  # mDNS discovery & manual IP connection
│   │   └── ShortcutPickerModal # App shortcut customization modal
│   ├── constants/          # Android KeyCodes, default apps & palettes
│   ├── services/           # AndroidTvService bridge interface
│   ├── types/              # TypeScript interfaces and connection models
│   └── utils/              # Custom hooks (e.g. useRepeatingKey)
└── android/                # Native Android Kotlin project
    └── app/src/main/java/com/androidtvremote/
        ├── AndroidTvRemoteModule.kt # React Native native bridge
        ├── PoloProtocol.kt          # Google Polo protocol packet serializer
        └── KeyStoreHelper.kt        # Self-signed TLS cert generator
```

---

## 🌿 Branching & Pull Request Process

1. Fork the repo and create your feature branch:
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat(dpad): add diagonal navigation support"
   ```
3. Ensure the project builds cleanly before opening a PR:
   ```bash
   npx tsc --noEmit
   npm run build:debug
   ```
4. Push to your branch and open a Pull Request against `main`.

---

## 💡 Ideas for Contribution

- [ ] Support for Android TV Trackpad / Mouse mode.
- [ ] Voice input / Google Assistant speech-to-text bridge.
- [ ] Home Assistant / MQTT integration.
- [ ] iOS target support (porting the Polo TLS socket client to Swift).
- [ ] Localizations and multilingual support.
