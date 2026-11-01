import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { androidTvService } from '../services/AndroidTvService';

interface KeyboardInputModalProps {
  visible: boolean;
  onClose: () => void;
  disabled?: boolean;
}

export const KeyboardInputModal: React.FC<KeyboardInputModalProps> = ({
  visible,
  onClose,
  disabled = false,
}) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) {
      setText('');
    }
  }, [visible]);

  const handleSend = () => {
    if (text.trim() && !disabled) {
      androidTvService.sendText(text);
      setText('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Type on TV</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Enter text or search query to send directly to your TV:
          </Text>

          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Search, login, or type text..."
            placeholderTextColor="#8C93A0"
            autoFocus
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!text.trim() || disabled) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!text.trim() || disabled}
            >
              <Text style={styles.sendText}>Send to TV</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 16,
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
  input: {
    backgroundColor: '#16181C',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    marginBottom: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#2D3036',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#D1D5DB',
    fontSize: 15,
    fontWeight: '600',
  },
  sendBtn: {
    flex: 1.5,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#1E3A8A',
    opacity: 0.5,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

