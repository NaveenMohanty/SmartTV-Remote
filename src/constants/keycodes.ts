/**
 * Standard Android KeyEvent KeyCodes used by Android TV Remote protocol
 */
export const AndroidKeyCode = {
  // Navigation
  DPAD_UP: 19,
  DPAD_DOWN: 20,
  DPAD_LEFT: 21,
  DPAD_RIGHT: 22,
  DPAD_CENTER: 23,

  // System
  BACK: 4,
  HOME: 3,
  POWER: 26,
  MENU: 82,
  SETTINGS: 176,
  TV_INPUT: 178,
  SEARCH: 84, // Google Assistant / Voice / Search

  // Audio / Volume
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  VOLUME_MUTE: 164,

  // Channels
  CHANNEL_UP: 166,
  CHANNEL_DOWN: 167,

  // Media Playback
  MEDIA_PLAY: 126,
  MEDIA_PAUSE: 127,
  MEDIA_PLAY_PAUSE: 85,
  MEDIA_STOP: 86,
  MEDIA_NEXT: 87,
  MEDIA_PREVIOUS: 88,
  MEDIA_REWIND: 89,
  MEDIA_FAST_FORWARD: 90,

  // Numeric (123)
  NUM_0: 7,
  NUM_1: 8,
  NUM_2: 9,
  NUM_3: 10,
  NUM_4: 11,
  NUM_5: 12,
  NUM_6: 13,
  NUM_7: 14,
  NUM_8: 15,
  NUM_9: 16,
  ENTER: 66,
} as const;

export type AndroidKeyCodeName = keyof typeof AndroidKeyCode;
