import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Vibration,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppShortcut } from '../types/shortcuts';
import { CURATED_TV_APPS } from '../constants/tvApps';

interface ShortcutPickerModalProps {
  visible: boolean;
  slotIndex: number;
  currentShortcut?: AppShortcut;
  onSelect: (shortcut: AppShortcut, slotIndex: number) => void;
  onClose: () => void;
}

export const ShortcutPickerModal: React.FC<ShortcutPickerModalProps> = ({
  visible,
  slotIndex,
  currentShortcut,
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCustomExpanded, setIsCustomExpanded] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customAppId, setCustomAppId] = useState('');

  const categories = ['All', 'OTT', 'Global', 'Music', 'Tools'];

  const filteredApps = useMemo(() => {
    let list = CURATED_TV_APPS;
    if (selectedCategory !== 'All') {
      list = list.filter((app) => app.category === selectedCategory);
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (app) =>
          app.name.toLowerCase().includes(q) ||
          app.id.toLowerCase().includes(q) ||
          (app.category && app.category.toLowerCase().includes(q))
      );
    }
    return list;
  }, [searchQuery, selectedCategory]);

  const handleSelectApp = (app: AppShortcut) => {
    try {
      Vibration.vibrate(25);
    } catch {}
    onSelect(app, slotIndex);
    onClose();
  };

  const handleAddCustomApp = () => {
    if (!customName.trim() || !customAppId.trim()) return;
    try {
      Vibration.vibrate(25);
    } catch {}
    const newApp: AppShortcut = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      appId: customAppId.trim(),
      iconType: 'custom',
      accentColor: '#4285F4',
      category: 'Tools',
    };
    onSelect(newApp, slotIndex);
    setCustomName('');
    setCustomAppId('');
    setIsCustomExpanded(false);
    onClose();
  };

  const renderAppBadge = (app: AppShortcut) => {
    const bg = app.accentColor || '#3B82F6';
    const initial = app.name.slice(0, 2).toUpperCase();

    if (app.iconType === 'youtube') {
      return (
        <View style={[styles.appBadge, { backgroundColor: '#FF0000' }]}>
          <View style={styles.badgeTriangle} />
        </View>
      );
    }
    if (app.iconType === 'hotstar') {
      return (
        <View style={[styles.appBadge, { backgroundColor: '#0F1014' }]}>
          <Text style={{ color: '#FFB800', fontSize: 14 }}>★</Text>
        </View>
      );
    }
    if (app.iconType === 'netflix') {
      return (
        <View style={[styles.appBadge, { backgroundColor: '#000000' }]}>
          <Text style={{ color: '#FF2430', fontSize: 13, fontWeight: '900' }}>N</Text>
        </View>
      );
    }
    if (app.iconType === 'prime') {
      return (
        <View style={[styles.appBadge, { backgroundColor: '#000000' }]}>
          <Text style={{ color: '#00A8E1', fontSize: 11, fontWeight: '800' }}>p</Text>
        </View>
      );
    }
    if (app.iconType === 'spotify') {
      return (
        <View style={[styles.appBadge, { backgroundColor: '#1DB954' }]}>
          <Text style={{ color: '#000000', fontSize: 13, fontWeight: '900' }}>♫</Text>
        </View>
      );
    }

    return (
      <View style={[styles.appBadge, { backgroundColor: bg }]}>
        <Text style={styles.badgeText}>{initial}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Sheet Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Slot {slotIndex + 1} Shortcut</Text>
              <Text style={styles.subtitle}>
                Currently: <Text style={styles.currentName}>{currentShortcut?.name || 'Empty'}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search TV apps (JioCinema, Sony LIV, Spotify)..."
              placeholderTextColor="#8E95A3"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Chips */}
          <View style={styles.categoryRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* App List */}
          <ScrollView style={styles.appList} contentContainerStyle={styles.appListContent} keyboardShouldPersistTaps="handled">
            {filteredApps.map((app) => {
              const isSelected = currentShortcut?.id === app.id || currentShortcut?.name === app.name;
              return (
                <TouchableOpacity
                  key={app.id}
                  style={[styles.appItem, isSelected && styles.appItemSelected]}
                  onPress={() => handleSelectApp(app)}
                  activeOpacity={0.7}
                >
                  <View style={styles.appLeft}>
                    {renderAppBadge(app)}
                    <View style={styles.appInfo}>
                      <Text style={styles.appName}>{app.name}</Text>
                      <Text style={styles.appCategory}>{app.category || 'Streaming'}</Text>
                    </View>
                  </View>

                  {isSelected ? (
                    <View style={styles.selectedPill}>
                      <Text style={styles.selectedPillText}>Active</Text>
                    </View>
                  ) : (
                    <View style={styles.assignPill}>
                      <Text style={styles.assignPillText}>Assign</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {filteredApps.length === 0 && (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No matching apps found in library.</Text>
                <Text style={styles.emptySub}>You can add it below as a custom app!</Text>
              </View>
            )}

            {/* Custom App Expandable Card */}
            <View style={styles.customSection}>
              <TouchableOpacity
                style={styles.customHeader}
                onPress={() => setIsCustomExpanded(!isCustomExpanded)}
                activeOpacity={0.7}
              >
                <Text style={styles.customHeaderTitle}>
                  {isCustomExpanded ? '− Close Custom App Form' : '+ Add Custom App or Package'}
                </Text>
              </TouchableOpacity>

              {isCustomExpanded && (
                <View style={styles.customForm}>
                  <Text style={styles.fieldLabel}>Display Name</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. JioCinema, Kodi, SmartTube"
                    placeholderTextColor="#71717A"
                    value={customName}
                    onChangeText={setCustomName}
                  />

                  <Text style={styles.fieldLabel}>Package Name or Deep Link URL</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. com.google.android.youtube.tv or https://..."
                    placeholderTextColor="#71717A"
                    value={customAppId}
                    onChangeText={setCustomAppId}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <TouchableOpacity
                    style={[
                      styles.addCustomBtn,
                      (!customName.trim() || !customAppId.trim()) && styles.addCustomBtnDisabled,
                    ]}
                    onPress={handleAddCustomApp}
                    disabled={!customName.trim() || !customAppId.trim()}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addCustomBtnText}>Assign Custom App to Slot {slotIndex + 1}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={{ height: 28 }} />
          </ScrollView>

          {/* Footer Hint */}
          <View style={styles.footer}>
            <Text style={styles.footerHint}>
              💡 Tip: Long-press any shortcut on the remote to quickly reassign it.
            </Text>
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
    backgroundColor: '#1E2024',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 16,
  },
  handle: {
    width: 40,
    height: 4.5,
    backgroundColor: '#3F444E',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 12.5,
    marginTop: 2,
  },
  currentName: {
    color: '#60A5FA',
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2E35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2E35',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 6,
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearch: {
    color: '#9CA3AF',
    fontSize: 14,
    paddingHorizontal: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2A2E35',
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
  },
  categoryText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  appList: {
    paddingHorizontal: 20,
  },
  appListContent: {
    gap: 8,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#262930',
    borderRadius: 14,
    padding: 12,
  },
  appItemSelected: {
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    backgroundColor: '#1E293B',
  },
  appLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderTopColor: 'transparent',
    borderBottomWidth: 5,
    borderBottomColor: 'transparent',
    borderLeftWidth: 8,
    borderLeftColor: '#FFFFFF',
    marginLeft: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  appInfo: {},
  appName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  appCategory: {
    color: '#9CA3AF',
    fontSize: 11.5,
    marginTop: 1,
  },
  selectedPill: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  selectedPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  assignPill: {
    backgroundColor: '#353A45',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  assignPillText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  emptySub: {
    color: '#60A5FA',
    fontSize: 12,
    marginTop: 4,
  },
  customSection: {
    marginTop: 12,
    backgroundColor: '#262930',
    borderRadius: 14,
    overflow: 'hidden',
  },
  customHeader: {
    padding: 14,
    alignItems: 'center',
  },
  customHeaderTitle: {
    color: '#60A5FA',
    fontSize: 13.5,
    fontWeight: '700',
  },
  customForm: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  fieldLabel: {
    color: '#9CA3AF',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 4,
  },
  fieldInput: {
    backgroundColor: '#1C1E23',
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 13,
    paddingHorizontal: 12,
    height: 40,
  },
  addCustomBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  addCustomBtnDisabled: {
    opacity: 0.45,
  },
  addCustomBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2A2E35',
  },
  footerHint: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
  },
});

