import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { AndroidKeyCode } from '../constants/keycodes';
import { androidTvService } from '../services/AndroidTvService';

interface NumberPadModalProps {
  visible: boolean;
  onClose: () => void;
  disabled?: boolean;
}

export const NumberPadModal: React.FC<NumberPadModalProps> = ({
  visible,
  onClose,
  disabled = false,
}) => {
  const handlePress = (keyCode: number) => {
    if (!disabled) {
      androidTvService.sendKey(keyCode);
    }
  };

  const rows: Array<Array<{ label: string; code: number; isSpecial?: boolean }>> = [
    [
      { label: '1', code: AndroidKeyCode.NUM_1 },
      { label: '2', code: AndroidKeyCode.NUM_2 },
      { label: '3', code: AndroidKeyCode.NUM_3 },
    ],
    [
      { label: '4', code: AndroidKeyCode.NUM_4 },
      { label: '5', code: AndroidKeyCode.NUM_5 },
      { label: '6', code: AndroidKeyCode.NUM_6 },
    ],
    [
      { label: '7', code: AndroidKeyCode.NUM_7 },
      { label: '8', code: AndroidKeyCode.NUM_8 },
      { label: '9', code: AndroidKeyCode.NUM_9 },
    ],
    [
      { label: 'Back', code: AndroidKeyCode.BACK, isSpecial: true },
      { label: '0', code: AndroidKeyCode.NUM_0 },
      { label: 'OK', code: AndroidKeyCode.ENTER, isSpecial: true },
    ],
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Channel & Number Pad</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {rows.map((row, rIdx) => (
              <View key={rIdx} style={styles.row}>
                {row.map((item, cIdx) => (
                  <TouchableOpacity
                    key={cIdx}
                    style={[
                      styles.numBtn,
                      item.isSpecial && styles.specialBtn,
                      disabled && styles.btnDisabled,
                    ]}
                    onPress={() => handlePress(item.code)}
                    activeOpacity={0.7}
                    disabled={disabled}
                  >
                    <Text
                      style={[
                        styles.numText,
                        item.isSpecial && styles.specialText,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#202226',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: '#32353B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2D3036',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  numBtn: {
    flex: 1,
    height: 60,
    backgroundColor: '#2D2E32',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  specialBtn: {
    backgroundColor: '#373A42',
  },
  numText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  specialText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#60A5FA',
  },
  btnDisabled: {
    opacity: 0.4,
  },
});

