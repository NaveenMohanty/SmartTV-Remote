import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Vibration, useWindowDimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AndroidKeyCode } from '../constants/keycodes';
import { androidTvService } from '../services/AndroidTvService';
import { useRepeatingKey } from '../utils/useRepeatingKey';

interface DPadProps {
  disabled?: boolean;
}

export const DPad: React.FC<DPadProps> = ({ disabled = false }) => {
  const { width, height } = useWindowDimensions();
  const availableWidth = Math.min(width, 460);

  const { startRepeating, stopRepeating } = useRepeatingKey();

  const dpadDiameter = Math.round(
    height < 680
      ? Math.min(availableWidth * 0.58, 208)
      : height < 760
      ? Math.min(availableWidth * 0.64, 234)
      : Math.min(availableWidth * 0.70, 256)
  );

  const centerDiameter = Math.round(dpadDiameter * 0.49);
  const chevronIconSize = Math.max(26, Math.round(dpadDiameter * 0.115));
  const selectFontSize = Math.max(14, Math.round(dpadDiameter * 0.066));
  const armThickness = Math.round((dpadDiameter - centerDiameter) / 2 + 9);
  const sideInset = Math.round(centerDiameter / 2);
  const marginV = height < 700 ? 6 : height < 780 ? 8 : 12;

  const handlePress = (keyCode: number) => {
    if (disabled) return;
    try {
      Vibration.vibrate(20);
    } catch {}
    androidTvService.sendKey(keyCode);
  };

  return (
    <View style={[styles.container, { marginVertical: marginV }]}>
      <View
        style={[
          styles.outerCircle,
          {
            width: dpadDiameter,
            height: dpadDiameter,
            borderRadius: dpadDiameter / 2,
          },
          disabled && styles.disabled,
        ]}
      >
        {/* UP BUTTON */}
        <TouchableOpacity
          style={[
            styles.directionBtn,
            styles.upBtn,
            { height: armThickness, left: sideInset, right: sideInset },
          ]}
          onPressIn={() =>
            startRepeating(AndroidKeyCode.DPAD_UP, {
              disabled,
              initialDelayMs: 340,
              intervalMs: 110,
            })
          }
          onPressOut={stopRepeating}
          activeOpacity={0.65}
          disabled={disabled}
        >
          <MaterialCommunityIcons name="chevron-up" size={chevronIconSize} color="#FFFFFF" />
        </TouchableOpacity>

        {/* LEFT BUTTON */}
        <TouchableOpacity
          style={[
            styles.directionBtn,
            styles.leftBtn,
            { width: armThickness, top: sideInset, bottom: sideInset },
          ]}
          onPressIn={() =>
            startRepeating(AndroidKeyCode.DPAD_LEFT, {
              disabled,
              initialDelayMs: 340,
              intervalMs: 110,
            })
          }
          onPressOut={stopRepeating}
          activeOpacity={0.65}
          disabled={disabled}
        >
          <MaterialCommunityIcons name="chevron-left" size={chevronIconSize} color="#FFFFFF" />
        </TouchableOpacity>

        {/* CENTER SELECT BUTTON */}
        <TouchableOpacity
          style={[
            styles.centerBtn,
            {
              width: centerDiameter,
              height: centerDiameter,
              borderRadius: centerDiameter / 2,
            },
          ]}
          onPress={() => handlePress(AndroidKeyCode.DPAD_CENTER)}
          onLongPress={() => {
            if (disabled) return;
            try {
              Vibration.vibrate(40);
            } catch {}
            androidTvService.sendKey(AndroidKeyCode.DPAD_CENTER, 'START');
            setTimeout(() => {
              androidTvService.sendKey(AndroidKeyCode.DPAD_CENTER, 'END');
            }, 550);
          }}
          delayLongPress={450}
          activeOpacity={0.7}
          disabled={disabled}
        >
          <Text style={[styles.selectText, { fontSize: selectFontSize }]}>Select</Text>
        </TouchableOpacity>

        {/* RIGHT BUTTON */}
        <TouchableOpacity
          style={[
            styles.directionBtn,
            styles.rightBtn,
            { width: armThickness, top: sideInset, bottom: sideInset },
          ]}
          onPressIn={() =>
            startRepeating(AndroidKeyCode.DPAD_RIGHT, {
              disabled,
              initialDelayMs: 340,
              intervalMs: 110,
            })
          }
          onPressOut={stopRepeating}
          activeOpacity={0.65}
          disabled={disabled}
        >
          <MaterialCommunityIcons name="chevron-right" size={chevronIconSize} color="#FFFFFF" />
        </TouchableOpacity>

        {/* DOWN BUTTON */}
        <TouchableOpacity
          style={[
            styles.directionBtn,
            styles.downBtn,
            { height: armThickness, left: sideInset, right: sideInset },
          ]}
          onPressIn={() =>
            startRepeating(AndroidKeyCode.DPAD_DOWN, {
              disabled,
              initialDelayMs: 340,
              intervalMs: 110,
            })
          }
          onPressOut={stopRepeating}
          activeOpacity={0.65}
          disabled={disabled}
        >
          <MaterialCommunityIcons name="chevron-down" size={chevronIconSize} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  outerCircle: {
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: '#27282D',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  directionBtn: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upBtn: {
    top: 0,
    left: 60,
    right: 60,
    height: 72,
    paddingTop: 8,
  },
  downBtn: {
    bottom: 0,
    left: 60,
    right: 60,
    height: 72,
    paddingBottom: 8,
  },
  leftBtn: {
    left: 0,
    top: 60,
    bottom: 60,
    width: 72,
    paddingLeft: 8,
  },
  rightBtn: {
    right: 0,
    top: 60,
    bottom: 60,
    width: 72,
    paddingRight: 8,
  },
  centerBtn: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: '#212226',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1C1D21',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.6,
  },
});
