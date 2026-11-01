import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  useWindowDimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AndroidKeyCode } from '../constants/keycodes';
import { androidTvService } from '../services/AndroidTvService';
import { AppShortcut } from '../types/shortcuts';
import { DEFAULT_SHORTCUTS } from '../constants/tvApps';
import { useRepeatingKey } from '../utils/useRepeatingKey';

interface ControlsClusterProps {
  disabled?: boolean;
  shortcuts?: AppShortcut[];
  onLaunchApp?: (appId: string, appName: string) => void;
  onCustomizeSlot?: (slotIndex: number) => void;
}

export const ControlsCluster: React.FC<ControlsClusterProps> = ({
  disabled = false,
  shortcuts = DEFAULT_SHORTCUTS,
  onLaunchApp,
  onCustomizeSlot,
}) => {
  const { width, height } = useWindowDimensions();
  const { startRepeating, stopRepeating } = useRepeatingKey();
  const isCompact = height < 760;
  const isVeryCompact = height < 680;

  const circleSize = isVeryCompact ? 48 : isCompact ? 52 : 58;
  const circleRadius = circleSize / 2;

  const rockerW = circleSize;
  const rockerH = isVeryCompact ? 110 : isCompact ? 122 : 132;
  const rockerRadius = rockerW / 2;
  const rockerHalfH = Math.round((rockerH - 22) / 2);

  const pillHeight = isVeryCompact ? 40 : isCompact ? 43 : 46;
  const pillRadius = Math.round(pillHeight * 0.3);

  const midMarginBottom = isVeryCompact ? 8 : isCompact ? 10 : 14;
  const hintMarginBottom = isVeryCompact ? 6 : 8;
  const rowMarginBottom = isVeryCompact ? 8 : isCompact ? 10 : 12;
  const rockerSymbolSize = isVeryCompact ? 20 : isCompact ? 22 : 24;

  const send = (code: number) => {
    if (disabled) return;
    try {
      Vibration.vibrate(20);
    } catch {}
    androidTvService.sendKey(code);
  };

  const handleLaunch = (appId: string, appName: string) => {
    if (disabled) return;
    try {
      Vibration.vibrate(20);
    } catch {}
    if (onLaunchApp) {
      onLaunchApp(appId, appName);
    } else {
      androidTvService.launchApp(appId);
    }
  };

  const activeShortcuts = shortcuts && shortcuts.length >= 4 ? shortcuts : DEFAULT_SHORTCUTS;

  const renderAppButtonContent = (app: AppShortcut) => {
    switch (app.iconType) {
      case 'youtube':
        return (
          <View style={styles.appBtnContent}>
            <MaterialCommunityIcons name="youtube" size={17} color="#FF0000" />
            <Text style={styles.ytText}>YouTube</Text>
          </View>
        );

      case 'hotstar':
        return (
          <View style={styles.appBtnContent}>
            <MaterialCommunityIcons name="star" size={12} color="#FFB800" />
            <Text style={styles.hotstarText}>{app.name}</Text>
          </View>
        );

      case 'netflix':
        return <Text style={styles.netflixText}>NETFLIX</Text>;

      case 'prime':
        return (
          <View style={styles.primeWrap}>
            <Text style={styles.primeText}>prime</Text>
            <Text style={styles.videoText}>video</Text>
          </View>
        );

      case 'spotify':
        return (
          <View style={styles.appBtnContent}>
            <MaterialCommunityIcons name="spotify" size={15} color="#1DB954" />
            <Text style={styles.genericAppText}>Spotify</Text>
          </View>
        );

      case 'jiocinema':
        return (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#D82384', fontSize: 10, fontWeight: '900', lineHeight: 11 }}>Jio</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 8.5, fontWeight: '700', lineHeight: 10 }}>Cinema</Text>
          </View>
        );

      default: {
        const displayName = app.name.length > 7 ? `${app.name.slice(0, 6)}…` : app.name;
        return (
          <View style={styles.appBtnContent}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: app.accentColor || '#60A5FA',
              }}
            />
            <Text style={styles.genericAppText}>{displayName}</Text>
          </View>
        );
      }
    }
  };

  const circleBtnDynamic = {
    width: circleSize,
    height: circleSize,
    borderRadius: circleRadius,
  };

  const rockerCapsuleDynamic = {
    width: rockerW,
    height: rockerH,
    borderRadius: rockerRadius,
  };

  const rockerHalfDynamic = {
    width: rockerW,
    height: rockerHalfH,
  };

  const pillBtnDynamic = {
    height: pillHeight,
    borderRadius: pillRadius,
  };

  return (
    <View style={styles.container}>
      {/* Middle 3-Column Navigation & Rockers Section */}
      <View style={[styles.midSection, { marginBottom: midMarginBottom }]}>
        {/* Left Column: Back Circle + Volume Rocker Capsule */}
        <View style={styles.column}>
          <TouchableOpacity
            style={[styles.circleBtn, circleBtnDynamic, disabled && styles.btnDisabled]}
            onPress={() => send(AndroidKeyCode.BACK)}
            disabled={disabled}
            activeOpacity={0.65}
          >
            <MaterialCommunityIcons name="arrow-u-left-top" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={[styles.rockerCapsule, rockerCapsuleDynamic, disabled && styles.btnDisabled]}>
            <TouchableOpacity
              style={[styles.rockerHalf, rockerHalfDynamic]}
              onPressIn={() =>
                startRepeating(AndroidKeyCode.VOLUME_UP, {
                  disabled,
                  initialDelayMs: 320,
                  intervalMs: 100,
                })
              }
              onPressOut={stopRepeating}
              disabled={disabled}
              activeOpacity={0.65}
            >
              <MaterialCommunityIcons name="plus" size={rockerSymbolSize} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={[styles.rockerCenterLabel, { width: rockerW }]}>
              <Text style={styles.rockerLabelText}>VOL</Text>
            </View>

            <TouchableOpacity
              style={[styles.rockerHalf, rockerHalfDynamic]}
              onPressIn={() =>
                startRepeating(AndroidKeyCode.VOLUME_DOWN, {
                  disabled,
                  initialDelayMs: 320,
                  intervalMs: 100,
                })
              }
              onPressOut={stopRepeating}
              disabled={disabled}
              activeOpacity={0.65}
            >
              <MaterialCommunityIcons name="minus" size={rockerSymbolSize} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Center Column: Home Circle + Mute Circle */}
        <View style={[styles.column, styles.centerColumn]}>
          <TouchableOpacity
            style={[styles.circleBtn, circleBtnDynamic, disabled && styles.btnDisabled]}
            onPress={() => send(AndroidKeyCode.HOME)}
            disabled={disabled}
            activeOpacity={0.65}
          >
            <MaterialCommunityIcons name="home" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={[styles.muteCenterWrap, { height: rockerH }]}>
            <TouchableOpacity
              style={[styles.circleBtn, circleBtnDynamic, disabled && styles.btnDisabled]}
              onPress={() => send(AndroidKeyCode.VOLUME_MUTE)}
              disabled={disabled}
              activeOpacity={0.65}
            >
              <MaterialCommunityIcons name="volume-mute" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Column: Source Circle + Channel Rocker Capsule */}
        <View style={styles.column}>
          <TouchableOpacity
            style={[styles.circleBtn, circleBtnDynamic, disabled && styles.btnDisabled]}
            onPress={() => send(AndroidKeyCode.TV_INPUT)}
            disabled={disabled}
            activeOpacity={0.65}
          >
            <MaterialCommunityIcons name="exit-to-app" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={[styles.rockerCapsule, rockerCapsuleDynamic, disabled && styles.btnDisabled]}>
            <TouchableOpacity
              style={[styles.rockerHalf, rockerHalfDynamic]}
              onPressIn={() =>
                startRepeating(AndroidKeyCode.CHANNEL_UP, {
                  disabled,
                  initialDelayMs: 380,
                  intervalMs: 240,
                })
              }
              onPressOut={stopRepeating}
              disabled={disabled}
              activeOpacity={0.65}
            >
              <MaterialCommunityIcons name="chevron-up" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={[styles.rockerCenterLabel, { width: rockerW }]}>
              <Text style={styles.rockerLabelText}>CH</Text>
            </View>

            <TouchableOpacity
              style={[styles.rockerHalf, rockerHalfDynamic]}
              onPressIn={() =>
                startRepeating(AndroidKeyCode.CHANNEL_DOWN, {
                  disabled,
                  initialDelayMs: 380,
                  intervalMs: 240,
                })
              }
              onPressOut={stopRepeating}
              disabled={disabled}
              activeOpacity={0.65}
            >
              <MaterialCommunityIcons name="chevron-down" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Long-press to customize hint */}
      <TouchableOpacity
        style={[styles.shortcutHintWrap, { marginBottom: hintMarginBottom }]}
        onPress={() => onCustomizeSlot?.(0)}
        activeOpacity={0.7}
      >
        <View style={styles.shortcutHintInner}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={15} color="#D97706" style={styles.hintIcon} />
          <Text style={styles.shortcutHintText}>
            Long-press any button to customize
          </Text>
        </View>
      </TouchableOpacity>

      {/* Customizable 4-Slot Streaming App Shortcuts Row */}
      <View style={[styles.bottomRow, { marginBottom: rowMarginBottom }]}>
        {activeShortcuts.slice(0, 4).map((app, idx) => (
          <TouchableOpacity
            key={`${app.id}_${idx}`}
            style={[styles.pillBtn, pillBtnDynamic, disabled && styles.btnDisabled]}
            onPress={() => handleLaunch(app.appId, app.name)}
            onLongPress={() => {
              try {
                Vibration.vibrate(35);
              } catch {}
              onCustomizeSlot?.(idx);
            }}
            delayLongPress={380}
            disabled={disabled}
            activeOpacity={0.65}
          >
            {renderAppButtonContent(app)}
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Function Row 2: Play, Pause, Rewind, Fast Forward */}
      <View style={[styles.bottomRow, { marginBottom: rowMarginBottom }]}>
        <TouchableOpacity
          style={[styles.pillBtn, pillBtnDynamic, disabled && styles.btnDisabled]}
          onPress={() => send(AndroidKeyCode.MEDIA_PLAY)}
          disabled={disabled}
          activeOpacity={0.65}
        >
          <MaterialCommunityIcons name="play" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pillBtn, pillBtnDynamic, disabled && styles.btnDisabled]}
          onPress={() => send(AndroidKeyCode.MEDIA_PAUSE)}
          disabled={disabled}
          activeOpacity={0.65}
        >
          <MaterialCommunityIcons name="pause" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pillBtn, pillBtnDynamic, disabled && styles.btnDisabled]}
          onPressIn={() =>
            startRepeating(AndroidKeyCode.MEDIA_REWIND, {
              disabled,
              initialDelayMs: 350,
              intervalMs: 180,
            })
          }
          onPressOut={stopRepeating}
          disabled={disabled}
          activeOpacity={0.65}
        >
          <MaterialCommunityIcons name="rewind" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pillBtn, pillBtnDynamic, disabled && styles.btnDisabled]}
          onPressIn={() =>
            startRepeating(AndroidKeyCode.MEDIA_FAST_FORWARD, {
              disabled,
              initialDelayMs: 350,
              intervalMs: 180,
            })
          }
          onPressOut={stopRepeating}
          disabled={disabled}
          activeOpacity={0.65}
        >
          <MaterialCommunityIcons name="fast-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 22,
    marginTop: 4,
  },
  midSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingHorizontal: 6,
  },
  shortcutHintWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: -2,
    width: '100%',
  },
  shortcutHintInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintIcon: {
    marginRight: 5,
  },
  shortcutHintText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  column: {
    alignItems: 'center',
    gap: 16,
  },
  centerColumn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  circleBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#27282D',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  muteCenterWrap: {
    height: 132,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rockerCapsule: {
    width: 58,
    height: 132,
    borderRadius: 29,
    backgroundColor: '#27282D',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  rockerHalf: {
    width: 58,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rockerCenterLabel: {
    width: 58,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rockerLabelText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  pillBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#27282D',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  appBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  ytText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  hotstarText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  netflixText: {
    color: '#FF2430',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  primeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primeText: {
    color: '#00A8E1',
    fontSize: 11.5,
    fontWeight: '800',
    lineHeight: 13,
  },
  videoText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    lineHeight: 10,
    marginTop: -1,
  },
  genericAppText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
