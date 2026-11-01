import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export type ToastType = 'error' | 'success' | 'info';

export interface ToastConfig {
  type: ToastType;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  autoDismissMs?: number;
}

interface ToastBannerProps {
  toast: ToastConfig | null;
  onDismiss: () => void;
}

export const ToastBanner: React.FC<ToastBannerProps> = ({ toast, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const dismissTime = toast.autoDismissMs ?? (toast.type === 'success' ? 3500 : 6000);
      if (dismissTime > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, dismissTime);
        return () => clearTimeout(timer);
      }
    } else {
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);
    }
  }, [toast]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!toast) return null;

  const getStyleTheme = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: '#14291F',
          border: '#10B981',
          icon: '✓',
          iconColor: '#10B981',
          actionColor: '#34D399',
        };
      case 'info':
        return {
          bg: '#16233B',
          border: '#3B82F6',
          icon: 'ℹ',
          iconColor: '#3B82F6',
          actionColor: '#60A5FA',
        };
      default: // error
        return {
          bg: '#2C1618',
          border: '#EF4444',
          icon: '⚠️',
          iconColor: '#EF4444',
          actionColor: '#F87171',
        };
    }
  };

  const theme = getStyleTheme();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.bg,
          borderColor: theme.border,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <Text style={[styles.icon, { color: theme.iconColor }]}>{theme.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{toast.title}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {toast.message}
          </Text>
        </View>

        {toast.actionText && toast.onAction && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              toast.onAction?.();
              handleDismiss();
            }}
          >
            <Text style={[styles.actionBtnText, { color: theme.actionColor }]}>
              {toast.actionText}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 55,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 16,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    marginRight: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
});

