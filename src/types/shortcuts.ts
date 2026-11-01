export interface AppShortcut {
  id: string;
  name: string;
  appId: string; // URL, deep link, or package name
  iconType?:
    | 'youtube'
    | 'hotstar'
    | 'netflix'
    | 'prime'
    | 'jiocinema'
    | 'spotify'
    | 'zee5'
    | 'sonyliv'
    | 'appletv'
    | 'plex'
    | 'vlc'
    | 'kodi'
    | 'custom';
  accentColor?: string;
  category?: 'OTT' | 'Music' | 'Global' | 'Tools';
}

