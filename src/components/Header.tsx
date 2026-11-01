import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ConnectionState } from '../types/remote';
import { AndroidKeyCode } from '../constants/keycodes';
import { androidTvService } from '../services/AndroidTvService';

interface HeaderProps {
  deviceName: string | null;
  state: ConnectionState;
  onOpenDevicePicker: () => void;
  onReconnect?: () => void;
  onWakeTv?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  deviceName,
  state,
  onOpenDevicePicker,
  onReconnect,
  onWakeTv,
}) => {
  const isConnected = state === 'CONNECTED';
  const isConnecting = state === 'CONNECTING';

  const handlePower = () => {
    if (isConnected) {
      androidTvService.sendKey(AndroidKeyCode.POWER);
    } else if (onWakeTv) {
      onWakeTv();
    } else if (onReconnect) {
      onReconnect();
    }
  };

  const handlePillPress = () => {
    if (!isConnected && !isConnecting && deviceName && onReconnect) {
      onReconnect();
    } else {
      onOpenDevicePicker();
    }
  };

  const getDisplayName = () => {
    if (!deviceName) return 'Select TV';
    if (isConnecting) return `${deviceName} ...`;
    return deviceName;
  };

  return (
    <View style={styles.container}>
      {/* 1. Left: Red Power Button */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={handlePower}
        activeOpacity={0.65}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <MaterialCommunityIcons name="power" size={28} color="#EF4444" />
      </TouchableOpacity>

      {/* 2. Center: Rounded Pill with TV Icon & Device Name */}
      <TouchableOpacity
        style={[
          styles.pillContainer,
          !isConnected && deviceName && styles.pillOffline,
        ]}
        onPress={handlePillPress}
        activeOpacity={0.75}
      >
        {isConnecting ? (
          <ActivityIndicator size="small" color="#2D44B8" style={styles.spinner} />
        ) : (
          <MaterialCommunityIcons name="television" size={20} color="#2D44B8" style={styles.tvIcon} />
        )}

        <Text style={styles.deviceNameText} numberOfLines={1}>
          {getDisplayName()}
        </Text>

        {!isConnected && deviceName && (
          <View style={styles.offlineDot} />
        )}
      </TouchableOpacity>

      {/* 3. Right: Switch Device Icon */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onOpenDevicePicker}
        activeOpacity={0.65}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <MaterialCommunityIcons name="exit-to-app" size={26} color="#27282D" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DFE7FD',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 24,
    maxWidth: '70%',
    elevation: 1,
    shadowColor: '#2D44B8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pillOffline: {
    backgroundColor: '#E8ECF5',
  },
  tvIcon: {
    marginRight: 8,
  },
  deviceNameText: {
    color: '#2D44B8',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  spinner: {
    marginRight: 8,
    transform: [{ scale: 0.8 }],
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginLeft: 8,
  },
});
