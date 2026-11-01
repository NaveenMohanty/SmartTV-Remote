import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import { AndroidKeyCode } from '../constants/keycodes';
import { androidTvService } from '../services/AndroidTvService';

interface MediaControlsProps {
  disabled?: boolean;
}

export const MediaControls: React.FC<MediaControlsProps> = ({ disabled = false }) => {
  const send = (code: number) => {
    if (disabled) return;
    try {
      Vibration.vibrate(20);
    } catch {}
    androidTvService.sendKey(code);
  };

  return (
    <View style={styles.container}>
      {/* System Navigation: Back, Home, Menu */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.pillButton}
          onPress={() => send(AndroidKeyCode.BACK)}
          disabled={disabled}
        >
          <Text style={styles.buttonText}>↩ Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pillButton}
          onPress={() => send(AndroidKeyCode.HOME)}
          disabled={disabled}
        >
          <Text style={styles.buttonText}>⌂ Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pillButton}
          onPress={() => send(AndroidKeyCode.MENU)}
          disabled={disabled}
        >
          <Text style={styles.buttonText}>☰ Menu</Text>
        </TouchableOpacity>
      </View>

      {/* Volume & Mute Controls */}
      <View style={styles.volRow}>
        <TouchableOpacity
          style={styles.volButton}
          onPress={() => send(AndroidKeyCode.VOLUME_UP)}
          disabled={disabled}
        >
          <Text style={styles.volText}>VOL +</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.muteButton}
          onPress={() => send(AndroidKeyCode.VOLUME_MUTE)}
          disabled={disabled}
        >
          <Text style={styles.muteText}>🔇 Mute</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.volButton}
          onPress={() => send(AndroidKeyCode.VOLUME_DOWN)}
          disabled={disabled}
        >
          <Text style={styles.volText}>VOL −</Text>
        </TouchableOpacity>
      </View>

      {/* Media Playback: Rewind, Play/Pause, Fast-Forward */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.mediaButton}
          onPress={() => send(AndroidKeyCode.MEDIA_REWIND)}
          disabled={disabled}
        >
          <Text style={styles.mediaText}>⏪</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mediaButton, styles.playButton]}
          onPress={() => send(AndroidKeyCode.MEDIA_PLAY_PAUSE)}
          disabled={disabled}
        >
          <Text style={styles.playText}>⏯</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mediaButton}
          onPress={() => send(AndroidKeyCode.MEDIA_FAST_FORWARD)}
          disabled={disabled}
        >
          <Text style={styles.mediaText}>⏩</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillButton: {
    flex: 1,
    height: 48,
    marginHorizontal: 6,
    borderRadius: 24,
    backgroundColor: '#1E232E',
    borderWidth: 1,
    borderColor: '#2A3241',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
  },
  volRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161A22',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: '#232A36',
  },
  volButton: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E232E',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  volText: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '700',
  },
  muteButton: {
    flex: 0.9,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2326',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  muteText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
  },
  mediaButton: {
    flex: 1,
    height: 48,
    marginHorizontal: 6,
    borderRadius: 14,
    backgroundColor: '#1E232E',
    borderWidth: 1,
    borderColor: '#2A3241',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  mediaText: {
    color: '#9CA3AF',
    fontSize: 18,
  },
  playText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
});
