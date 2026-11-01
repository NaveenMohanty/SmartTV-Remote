import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DiscoveredDevice } from '../types/remote';

interface DevicePickerModalProps {
  visible: boolean;
  devices: DiscoveredDevice[];
  isScanning: boolean;
  onClose: () => void;
  onSelectDevice: (device: DiscoveredDevice) => void;
  onRescan: () => void;
}

export const DevicePickerModal: React.FC<DevicePickerModalProps> = ({
  visible,
  devices,
  isScanning,
  onClose,
  onSelectDevice,
  onRescan,
}) => {
  const [manualIp, setManualIp] = useState('');

  const handleManualConnect = () => {
    if (!manualIp.trim()) return;
    onSelectDevice({
      id: manualIp.trim(),
      name: `Android TV (${manualIp.trim()})`,
      ip: manualIp.trim(),
      port: 6466,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Available TVs on Wi-Fi</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Scan Status & Refresh */}
          <View style={styles.statusRow}>
            {isScanning ? (
              <View style={styles.scanningBadge}>
                <ActivityIndicator size="small" color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={styles.scanningText}>Scanning local network (mDNS)...</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.rescanBtn} onPress={onRescan}>
                <Text style={styles.rescanText}>🔄 Refresh Scan</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Device List */}
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id || item.ip}
            ListEmptyComponent={
              !isScanning ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No Android TV devices found yet.</Text>
                  <Text style={styles.emptySubtext}>
                    Ensure your TV is turned on and connected to the exact same Wi-Fi network.
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.deviceCard}
                onPress={() => onSelectDevice(item)}
                activeOpacity={0.7}
              >
                <View style={styles.tvIconContainer}>
                  <MaterialCommunityIcons name="television" size={24} color="#2D44B8" />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.tvName}>{item.name}</Text>
                  <Text style={styles.tvIp}>{item.ip}:{item.port || 6466}</Text>
                </View>
                <Text style={styles.connectArrow}>Connect ›</Text>
              </TouchableOpacity>
            )}
          />

          {/* Manual IP Fallback */}
          <View style={styles.manualSection}>
            <Text style={styles.manualLabel}>Or connect by IP directly:</Text>
            <View style={styles.manualRow}>
              <TextInput
                style={styles.input}
                placeholder="192.168.1.100"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                value={manualIp}
                onChangeText={setManualIp}
              />
              <TouchableOpacity
                style={styles.manualBtn}
                onPress={handleManualConnect}
              >
                <Text style={styles.manualBtnText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#161A22',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#232A36',
    width: '100%',
    maxWidth: 520,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    color: '#9CA3AF',
    fontSize: 18,
  },
  statusRow: {
    marginVertical: 10,
  },
  scanningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanningText: {
    color: '#93C5FD',
    fontSize: 13,
  },
  rescanBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1E232E',
  },
  rescanText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E232E',
    padding: 14,
    borderRadius: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#2A3241',
  },
  tvIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2A3241',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tvIcon: {
    fontSize: 22,
  },
  deviceInfo: {
    flex: 1,
  },
  tvName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tvIp: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  connectArrow: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#D1D5DB',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  manualSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#232A36',
  },
  manualLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 8,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1E232E',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A3241',
  },
  manualBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
  },
  manualBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
