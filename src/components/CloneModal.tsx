import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { InstalledApp } from '../types';
import { ShieldCheck, Copy, X } from 'lucide-react-native';

interface CloneModalProps {
  visible: boolean;
  app: InstalledApp | null;
  onClose: () => void;
  onConfirm: (packageName: string, alias: string) => void;
  isCloning?: boolean;
}

export const CloneModal: React.FC<CloneModalProps> = ({
  visible,
  app,
  onClose,
  onConfirm,
  isCloning = false,
}) => {
  const { colors } = useTheme();
  const [alias, setAlias] = useState('');

  useEffect(() => {
    if (app) {
      const spaceNum = (app.cloneCount || 0) + 1;
      setAlias(`${app.appName} (Space ${spaceNum})`);
    }
  }, [app]);

  if (!app) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              {app.iconUri ? (
                <Image source={{ uri: app.iconUri }} style={styles.headerIcon} />
              ) : (
                <View style={[styles.fallbackIcon, { backgroundColor: colors.primaryGlow }]}>
                  <Text style={[styles.fallbackText, { color: colors.primary }]}>
                    {app.appName.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  Clone Application
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  {app.packageName}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Alias Input */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Instance Name / Alias
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={alias}
              onChangeText={setAlias}
              placeholder="e.g. Work Account"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Virtual Isolation Guarantee Box */}
          <View style={[styles.guaranteeBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ShieldCheck size={20} color={colors.accent} style={styles.guaranteeIcon} />
            <View style={styles.guaranteeTextCol}>
              <Text style={[styles.guaranteeTitle, { color: colors.textPrimary }]}>
                Full Data Isolation
              </Text>
              <Text style={[styles.guaranteeDesc, { color: colors.textSecondary }]}>
                The original {app.appName} app and all existing accounts remain completely untouched. This clone has its own independent login session, storage, and cache.
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={isCloning}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={() => onConfirm(app.packageName, alias)}
              disabled={isCloning}
            >
              <Copy size={16} color="#FFFFFF" />
              <Text style={styles.confirmText}>
                {isCloning ? 'Creating Clone...' : 'Create Clone'}
              </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 12,
  },
  fallbackIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 22,
  },
  guaranteeIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  guaranteeTextCol: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  guaranteeDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
