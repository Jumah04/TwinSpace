import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useTwinSpace } from '../context/TwinSpaceContext';
import { Header } from '../components/Header';
import { StorageBar } from '../components/StorageBar';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { StorageInfo } from '../types';
import {
  Play,
  Smartphone,
  Trash2,
  RotateCcw,
  Eraser,
  FolderLock,
  Layers,
  Calendar,
  Clock,
} from 'lucide-react-native';

export const AppDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const {
    selectedClone,
    launchClone,
    removeClone,
    createShortcut,
    clearCache,
    clearData,
    getStorageInfo,
    setActiveScreen,
  } = useTwinSpace();

  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const [modalAction, setModalAction] = useState<'delete' | 'clearData' | null>(null);

  useEffect(() => {
    if (selectedClone) {
      loadStorage();
    }
  }, [selectedClone]);

  const loadStorage = async () => {
    if (!selectedClone) return;
    setIsLoadingStorage(true);
    try {
      const info = await getStorageInfo(selectedClone.id);
      setStorage(info);
    } catch (e) {
      console.error('Storage info failed', e);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  if (!selectedClone) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack onBack={() => setActiveScreen('home')} title="Application Details" />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            No application selected
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLaunch = () => {
    launchClone(selectedClone.id);
  };

  const handleCreateShortcut = () => {
    createShortcut(selectedClone.id);
  };

  const handleClearCache = async () => {
    await clearCache(selectedClone.id);
    await loadStorage();
  };

  const handleConfirmClearData = async () => {
    await clearData(selectedClone.id);
    await loadStorage();
    setModalAction(null);
  };

  const handleConfirmDelete = async () => {
    await removeClone(selectedClone.id);
    setModalAction(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        showBack
        onBack={() => setActiveScreen('home')}
        title={selectedClone.alias}
        subtitle="Virtual Sandbox Management"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* App Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.iconBox}>
            {selectedClone.iconUri ? (
              <Image source={{ uri: selectedClone.iconUri }} style={styles.appIcon} />
            ) : (
              <View style={[styles.fallbackIcon, { backgroundColor: colors.primaryGlow }]}>
                <Text style={[styles.fallbackText, { color: colors.primary }]}>
                  {selectedClone.appName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>Space {selectedClone.userId + 1}</Text>
            </View>
          </View>

          <Text style={[styles.appName, { color: colors.textPrimary }]}>
            {selectedClone.alias}
          </Text>
          <Text style={[styles.packageName, { color: colors.textMuted }]}>
            {selectedClone.packageName}
          </Text>

          {/* Quick Launch Button */}
          <TouchableOpacity
            style={[styles.launchBtn, { backgroundColor: colors.primary }]}
            onPress={handleLaunch}
            activeOpacity={0.8}
          >
            <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.launchBtnText}>Open Cloned Application</Text>
          </TouchableOpacity>
        </View>

        {/* Sandbox Storage Section */}
        {isLoadingStorage ? (
          <View style={[styles.storageLoading, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.storageLoadingText, { color: colors.textSecondary }]}>
              Measuring virtual sandbox storage...
            </Text>
          </View>
        ) : storage ? (
          <StorageBar storage={storage} />
        ) : null}

        {/* Actions Card */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Management Actions</Text>
        <View style={[styles.actionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Add Shortcut */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleCreateShortcut}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.accentGlow }]}>
              <Smartphone size={20} color={colors.accent} />
            </View>
            <View style={styles.actionTextBox}>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                Pin Shortcut to Home Screen
              </Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                Launch this clone directly with one tap from your launcher
              </Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Clear Cache */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleClearCache}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.primaryGlow }]}>
              <Eraser size={20} color={colors.primary} />
            </View>
            <View style={styles.actionTextBox}>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                Clear Cache Files
              </Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                Reclaims storage without deleting account or settings
              </Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Reset All Data */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setModalAction('clearData')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.warning + '20' }]}>
              <RotateCcw size={20} color={colors.warning} />
            </View>
            <View style={styles.actionTextBox}>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                Reset Clone Data
              </Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                Clears login session and resets to fresh state
              </Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Remove Clone */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setModalAction('delete')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.dangerGlow }]}>
              <Trash2 size={20} color={colors.danger} />
            </View>
            <View style={styles.actionTextBox}>
              <Text style={[styles.actionTitle, { color: colors.danger }]}>
                Delete Cloned Instance
              </Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                Permanently removes sandbox directory from phone
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Clone Information Card */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Instance Information</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <View style={styles.infoLabelGroup}>
              <FolderLock size={16} color={colors.textSecondary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Sandbox Directory</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              /users/{selectedClone.userId}/{selectedClone.packageName}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabelGroup}>
              <Calendar size={16} color={colors.textSecondary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Created</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {formatDate(selectedClone.createdAt)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabelGroup}>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Last Launched</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {formatDate(selectedClone.lastLaunchedAt)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modals */}
      <ConfirmationModal
        visible={modalAction === 'clearData'}
        title="Reset Clone Data?"
        message={`Are you sure you want to reset all data for "${selectedClone.alias}"?\n\nThis will log you out and wipe all local databases and cached storage. The original app is completely unaffected.`}
        confirmLabel="Reset Data"
        isDestructive
        onConfirm={handleConfirmClearData}
        onCancel={() => setModalAction(null)}
      />

      <ConfirmationModal
        visible={modalAction === 'delete'}
        title="Delete Cloned Instance?"
        message={`Are you sure you want to delete "${selectedClone.alias}"?\n\nAll virtual files, databases, and preferences will be permanently wiped.`}
        confirmLabel="Delete Instance"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setModalAction(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  profileCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    position: 'relative',
    marginBottom: 14,
  },
  appIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  fallbackIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 26,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  packageName: {
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
    borderRadius: 16,
    gap: 8,
  },
  launchBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  storageLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginVertical: 10,
    gap: 12,
  },
  storageLoadingText: {
    fontSize: 13.5,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 10,
    marginLeft: 4,
  },
  actionsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionTextBox: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginLeft: 72,
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
});
