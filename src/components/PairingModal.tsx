import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

interface PairingModalProps {
  visible: boolean;
  tvName: string;
  error?: string | null;
  isSubmitting?: boolean;
  onSubmitPin: (pin: string) => void;
  onCancel: () => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  visible,
  tvName,
  error,
  isSubmitting = false,
  onSubmitPin,
  onCancel,
}) => {
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (visible) {
      setPin('');
    }
  }, [visible]);

  const handleSubmit = () => {
    if (pin.trim().length >= 4 && !isSubmitting) {
      onSubmitPin(pin.trim());
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Pair with TV</Text>
          <Text style={styles.subtitle}>
            Enter the pairing code currently displayed on{' '}
            <Text style={styles.highlight}>{tvName || 'your TV'}</Text>:
          </Text>

          <TextInput
            style={[styles.pinInput, !!error && styles.pinInputError]}
            value={pin}
            onChangeText={setPin}
            placeholder="e.g. 7010BE"
            placeholderTextColor="#6B7280"
            keyboardType="default"
            autoCapitalize="characters"
            maxLength={8}
            editable={!isSubmitting}
            autoFocus
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (pin.length < 4 || isSubmitting) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={pin.length < 4 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Pair & Connect</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1E232E',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A3241',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  highlight: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  pinInput: {
    backgroundColor: '#13161F',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: 14,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 4,
    paddingVertical: 14,
    marginBottom: 12,
  },
  pinInputError: {
    borderColor: '#EF4444',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#262D3D',
    alignItems: 'center',
  },
  cancelText: {
    color: '#D1D5DB',
    fontSize: 15,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#1E3A8A',
    opacity: 0.5,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
