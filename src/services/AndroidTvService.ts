import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import {
  DiscoveredDevice,
  ConnectionState,
  AndroidTvRemoteNative,
  RemoteErrorEvent,
} from '../types/remote';

const { AndroidTvRemote } = NativeModules;

class AndroidTvService {
  private emitter: NativeEventEmitter | null = null;
  private nativeModule: AndroidTvRemoteNative | null = null;

  constructor() {
    if (Platform.OS === 'android' && AndroidTvRemote) {
      this.nativeModule = AndroidTvRemote as AndroidTvRemoteNative;
      this.emitter = new NativeEventEmitter(AndroidTvRemote);
    }
  }

  public isAvailable(): boolean {
    return this.nativeModule !== null;
  }

  public startDiscovery(): void {
    if (this.nativeModule) {
      this.nativeModule.startDiscovery();
    } else {
      console.warn('[AndroidTvService] Native module not mounted. Using mock mode.');
    }
  }

  public stopDiscovery(): void {
    this.nativeModule?.stopDiscovery();
  }

  public startPairing(device: DiscoveredDevice): void {
    this.nativeModule?.startPairing(device.ip, device.port);
  }

  public sendPin(pin: string): void {
    this.nativeModule?.sendPairingPin(pin);
  }

  public connect(device: DiscoveredDevice): void {
    this.nativeModule?.connect(device.ip, device.port);
  }

  public disconnect(): void {
    this.nativeModule?.disconnect();
  }

  public sendKey(keyCode: number, direction: 'SHORT' | 'START' | 'END' = 'SHORT'): void {
    this.nativeModule?.sendKey(keyCode, direction);
  }

  public sendText(text: string): void {
    this.nativeModule?.sendText(text);
  }

  public wakeDevice(mac?: string, ip?: string): void {
    this.nativeModule?.wakeDevice(mac, ip);
  }

  public launchApp(appId: string): void {
    this.nativeModule?.launchApp(appId);
  }

  public async saveShortcuts(shortcuts: any[]): Promise<void> {
    try {
      await this.nativeModule?.saveShortcuts(JSON.stringify(shortcuts));
    } catch (e) {
      console.warn('Failed to save shortcuts:', e);
    }
  }

  public async getSavedShortcuts(): Promise<any[] | null> {
    try {
      const json = await this.nativeModule?.getSavedShortcuts();
      if (json) {
        return JSON.parse(json);
      }
    } catch (e) {
      console.warn('Failed to load saved shortcuts:', e);
    }
    return null;
  }

  // Event Listeners
  public onDeviceDiscovered(callback: (device: DiscoveredDevice) => void) {
    return this.emitter?.addListener('onDeviceDiscovered', callback);
  }

  public onPairingRequested(callback: (info: { ip: string }) => void) {
    return this.emitter?.addListener('onPairingRequested', callback);
  }

  public onStateChanged(callback: (state: ConnectionState) => void) {
    return this.emitter?.addListener('onStateChanged', (data: any) => {
      const state: ConnectionState =
        typeof data === 'string'
          ? (data as ConnectionState)
          : (data?.state as ConnectionState) || 'DISCONNECTED';
      callback(state);
    });
  }

  public onError(callback: (error: RemoteErrorEvent) => void) {
    return this.emitter?.addListener('onError', (data: any) => {
      const err: RemoteErrorEvent = {
        code: data?.code || 'CONNECTION_FAILED',
        message: data?.message || 'Connection error',
        ip: data?.ip,
      };
      callback(err);
    });
  }
}

export const androidTvService = new AndroidTvService();
