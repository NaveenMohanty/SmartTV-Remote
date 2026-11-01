export interface DiscoveredDevice {
  id: string;
  name: string;
  ip: string;
  port: number;
  mac?: string;
}

export type ConnectionState =
  | 'DISCONNECTED'
  | 'SCANNING'
  | 'PAIRING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ERROR';

export type KeyDirection = 'SHORT' | 'START' | 'END';

export type ErrorCode =
  | 'TV_OFFLINE'
  | 'PAIRING_REQUIRED'
  | 'INVALID_PIN'
  | 'CONNECTION_LOST'
  | 'NETWORK_UNREACHABLE'
  | 'CONNECTION_FAILED';

export interface RemoteErrorEvent {
  code: ErrorCode;
  message: string;
  ip?: string;
}

export interface AndroidTvRemoteNative {
  startDiscovery(): void;
  stopDiscovery(): void;
  startPairing(ip: string, port: number): void;
  sendPairingPin(pin: string): void;
  connect(ip: string, port: number): void;
  disconnect(): void;
  sendKey(keyCode: number, direction?: KeyDirection): void;
  sendText(text: string): void;
  wakeDevice(mac?: string, ip?: string): void;
  launchApp(appId: string): void;
  saveShortcuts(json: string): Promise<boolean>;
  getSavedShortcuts(): Promise<string | null>;
}
