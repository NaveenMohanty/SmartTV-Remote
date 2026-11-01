import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
  Vibration,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {
  DiscoveredDevice,
  ConnectionState,
  RemoteErrorEvent,
} from './src/types/remote';
import { Header } from './src/components/Header';
import { DPad } from './src/components/DPad';
import { ControlsCluster } from './src/components/ControlsCluster';
import { DevicePickerModal } from './src/components/DevicePickerModal';
import { PairingModal } from './src/components/PairingModal';
import { ShortcutPickerModal } from './src/components/ShortcutPickerModal';
import { ToastBanner, ToastConfig } from './src/components/ToastBanner';
import { androidTvService } from './src/services/AndroidTvService';
import { AppShortcut } from './src/types/shortcuts';
import { DEFAULT_SHORTCUTS } from './src/constants/tvApps';

export default function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DiscoveredDevice | null>(null);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [showPairing, setShowPairing] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Custom Shortcuts State
  const [shortcuts, setShortcuts] = useState<AppShortcut[]>(DEFAULT_SHORTCUTS);
  const [showShortcutModal, setShowShortcutModal] = useState<boolean>(false);
  const [customizingSlot, setCustomizingSlot] = useState<number>(0);

  // Error & Toast States
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [isSubmittingPin, setIsSubmittingPin] = useState<boolean>(false);

  const selectedDeviceRef = useRef<DiscoveredDevice | null>(null);
  selectedDeviceRef.current = selectedDevice;

  const showToast = (
    type: 'error' | 'success' | 'info',
    title: string,
    message: string,
    actionText?: string,
    onAction?: () => void,
    autoDismissMs?: number
  ) => {
    setToast({
      type,
      title,
      message,
      actionText,
      onAction,
      autoDismissMs,
    });
  };

  const handleConnect = (device: DiscoveredDevice | null) => {
    if (!device) {
      setShowPicker(true);
      handleStartScan();
      return;
    }
    setSelectedDevice(device);
    setConnectionState('CONNECTING');
    androidTvService.connect(device);
  };

  const handleWakeTv = (device: DiscoveredDevice | null) => {
    const target = device || selectedDevice;
    if (!target) return;

    showToast(
      'info',
      'Waking TV',
      `Sending Wake-on-LAN signal to ${target.name}...`,
      undefined,
      undefined,
      3000
    );
    androidTvService.wakeDevice(target.mac, target.ip);

    // Wait 2.5s for TV to power on Wi-Fi interface, then connect
    setTimeout(() => {
      handleConnect(target);
    }, 2500);
  };

  useEffect(() => {
    // Listen for mDNS discovered devices
    const deviceSub = androidTvService.onDeviceDiscovered((newDevice) => {
      setDevices((prev) => {
        if (!prev.some((d) => d.ip === newDevice.ip)) {
          return [...prev, newDevice];
        }
        return prev;
      });

      // Auto-select discovered device if none is selected yet
      setSelectedDevice((prev) => {
        if (!prev) {
          androidTvService.connect(newDevice);
          return newDevice;
        }
        return prev;
      });
    });

    // Listen for pairing prompt
    const pairSub = androidTvService.onPairingRequested(() => {
      setPairingError(null);
      setIsSubmittingPin(false);
      setShowPairing(true);
      setConnectionState('PAIRING');
    });

    // Listen for connection state changes
    const stateSub = androidTvService.onStateChanged((state) => {
      setConnectionState(state);
      if (state === 'CONNECTED') {
        setShowPairing(false);
        setShowPicker(false);
        setPairingError(null);
        setIsSubmittingPin(false);

        const currentDevice = selectedDeviceRef.current;
        showToast(
          'success',
          'Connected',
          `Connected to ${currentDevice?.name || 'Android TV'}`
        );
      }
    });

    // Listen for structured error events
    const errSub = androidTvService.onError((err: RemoteErrorEvent) => {
      const current = selectedDeviceRef.current;

      switch (err.code) {
        case 'INVALID_PIN':
          setIsSubmittingPin(false);
          setPairingError(err.message);
          break;

        case 'TV_OFFLINE':
          showToast(
            'error',
            'TV is Offline',
            err.message,
            'Wake TV',
            () => handleWakeTv(current)
          );
          break;

        case 'CONNECTION_LOST':
          showToast(
            'info',
            'Connection Lost',
            `Disconnected from ${current?.name || 'TV'}.`,
            'Reconnect',
            () => handleConnect(current)
          );
          break;

        case 'PAIRING_REQUIRED':
          showToast(
            'info',
            'Pairing Required',
            'Please enter the pairing code displayed on your TV screen.'
          );
          break;

        case 'NETWORK_UNREACHABLE':
          showToast(
            'error',
            'Network Error',
            err.message,
            'Retry',
            () => handleConnect(current)
          );
          break;

        default:
          showToast(
            'error',
            'Connection Issue',
            err.message,
            'Retry',
            () => handleConnect(current)
          );
          break;
      }
    });

    // Load user's saved shortcuts on launch
    androidTvService.getSavedShortcuts().then((saved) => {
      if (saved && Array.isArray(saved) && saved.length >= 4) {
        setShortcuts(saved);
      }
    });

    // Start discovery automatically on app launch
    handleStartScan();

    return () => {
      deviceSub?.remove();
      pairSub?.remove();
      stateSub?.remove();
      errSub?.remove();
      androidTvService.stopDiscovery();
    };
  }, []);

  const handleStartScan = () => {
    setIsScanning(true);
    setDevices([]);
    androidTvService.startDiscovery();
    setTimeout(() => setIsScanning(false), 10000);
  };

  const handleSelectDevice = (device: DiscoveredDevice) => {
    handleConnect(device);
  };

  const handlePinSubmit = (pin: string) => {
    setIsSubmittingPin(true);
    setPairingError(null);
    androidTvService.sendPin(pin);
  };

  const handleControlsTouchWhenOffline = () => {
    if (!isConnected && selectedDevice) {
      showToast(
        'info',
        'TV Disconnected',
        `Attempting to reconnect to ${selectedDevice.name}...`,
        'Wake TV',
        () => handleWakeTv(selectedDevice),
        3000
      );
      handleConnect(selectedDevice);
    }
  };

  const handleSelectShortcut = (app: AppShortcut, slotIndex: number) => {
    setShortcuts((prev) => {
      const updated = [...prev];
      updated[slotIndex] = app;
      androidTvService.saveShortcuts(updated);
      return updated;
    });
    showToast(
      'success',
      'Shortcut Updated',
      `Slot ${slotIndex + 1} set to ${app.name}`,
      undefined,
      undefined,
      2000
    );
  };

  const { width, height } = useWindowDimensions();
  const isTablet = width >= 600 || (width >= 480 && height >= 900);
  const isConnected = connectionState === 'CONNECTED';

  return (
    <SafeAreaView style={[styles.container, isTablet && styles.containerTablet]}>
      <StatusBar barStyle="dark-content" backgroundColor={isTablet ? '#D5DAE3' : '#E4E7ED'} />

      {/* Floating Modern Toast Notification */}
      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />

      {/* Remote Chassis - Full-width on mobile, Elegant curved Remote Card on Tablets */}
      <View style={[styles.remoteChassis, isTablet && styles.remoteChassisTablet]}>
        {/* Top Header */}
        <Header
          deviceName={selectedDevice?.name || null}
          state={connectionState}
          onOpenDevicePicker={() => {
            setShowPicker(true);
            handleStartScan();
          }}
          onReconnect={() => handleConnect(selectedDevice)}
          onWakeTv={() => handleWakeTv(selectedDevice)}
        />

        {/* Scrollable Remote Body */}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.scrollContentTablet,
            { paddingBottom: height < 720 ? 8 : 16 },
          ]}
          bounces={false}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
        >
          {/* Directional Pad with "Select" Center Button */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleControlsTouchWhenOffline}
            style={styles.touchArea}
          >
            <DPad disabled={!isConnected} />
          </TouchableOpacity>

          {/* 3-Column Navigation, Rockers & Bottom Function Keys */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleControlsTouchWhenOffline}
            style={styles.touchArea}
          >
            <ControlsCluster
              disabled={!isConnected}
              shortcuts={shortcuts}
              onLaunchApp={(appId: string, appName: string) => {
                androidTvService.launchApp(appId);
                showToast(
                  'info',
                  appName,
                  `Opening ${appName} on TV...`,
                  undefined,
                  undefined,
                  2500
                );
              }}
              onCustomizeSlot={(slotIdx: number) => {
                setCustomizingSlot(slotIdx);
                setShowShortcutModal(true);
              }}
            />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Custom Shortcut Assignment Modal */}
      <ShortcutPickerModal
        visible={showShortcutModal}
        slotIndex={customizingSlot}
        currentShortcut={shortcuts[customizingSlot]}
        onSelect={handleSelectShortcut}
        onClose={() => setShowShortcutModal(false)}
      />

      {/* Device Picker Modal */}
      <DevicePickerModal
        visible={showPicker}
        devices={devices}
        isScanning={isScanning}
        onClose={() => setShowPicker(false)}
        onSelectDevice={handleSelectDevice}
        onRescan={handleStartScan}
      />

      {/* Pairing PIN Modal */}
      <PairingModal
        visible={showPairing}
        tvName={selectedDevice?.name || 'Android TV'}
        error={pairingError}
        isSubmitting={isSubmittingPin}
        onSubmitPin={handlePinSubmit}
        onCancel={() => {
          setShowPairing(false);
          setPairingError(null);
          setIsSubmittingPin(false);
          androidTvService.disconnect();
          setConnectionState('DISCONNECTED');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E4E7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerTablet: {
    backgroundColor: '#D5DAE3',
    paddingVertical: 24,
  },
  remoteChassis: {
    width: '100%',
    maxWidth: 440,
    flex: 1,
    backgroundColor: '#E4E7ED',
  },
  remoteChassisTablet: {
    borderRadius: 36,
    maxHeight: 820,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  scrollContentTablet: {
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  touchArea: {
    width: '100%',
  },
});
