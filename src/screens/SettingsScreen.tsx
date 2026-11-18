import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useTwinSpace } from '../context/TwinSpaceContext';
import { Header } from '../components/Header';
import { ThemeMode } from '../types';
import {
  Moon,
  Sun,
  Smartphone,
  Cpu,
  ShieldCheck,
  HardDrive,
  Info,
  Layers,
  Heart,
} from 'lucide-react-native';

export const SettingsScreen: React.FC = () => {
  const { colors, mode, setThemeMode } = useTheme();
  const { sysInfo, clonedApps, setActiveScreen } = useTwinSpace();

  const themeOptions: { label: string; mode: ThemeMode; icon: any }[] = [
    { label: 'Dark Mode', mode: 'dark', icon: Moon },
    { label: 'Light Mode', mode: 'light', icon: Sun },
    { label: 'System Default', mode: 'system', icon: Smartphone },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        showBack
        onBack={() => setActiveScreen('home')}
        title="Settings & System"
        subtitle="Configuration & Virtual Engine Diagnostics"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Theme Selection */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Theme & Appearance</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {themeOptions.map((opt, idx) => {
            const isSelected = mode === opt.mode;
            const Icon = opt.icon;
            return (
              <React.Fragment key={opt.mode}>
                <TouchableOpacity
                  style={styles.themeRow}
                  onPress={() => setThemeMode(opt.mode)}
                  activeOpacity={0.7}
                >
                  <View style={styles.themeLeft}>
                    <View
                      style={[
                        styles.themeIconBox,
                        {
                          backgroundColor: isSelected ? colors.primaryGlow : colors.surface,
                        },
                      ]}
                    >
                      <Icon
                        size={18}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.themeLabel,
                        {
                          color: isSelected ? colors.primary : colors.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
                {idx < themeOptions.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Engine Diagnostics */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Virtual Engine Diagnostics
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.diagRow}>
            <View style={styles.diagLabelGroup}>
              <Cpu size={16} color={colors.textSecondary} />
              <Text style={[styles.diagLabel, { color: colors.textSecondary }]}>
                Virtualization Subsystem
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: colors.success + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusPillText, { color: colors.success }]}>Active / Sandboxed</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.diagRow}>
            <View style={styles.diagLabelGroup}>
              <ShieldCheck size={16} color={colors.textSecondary} />
              <Text style={[styles.diagLabel, { color: colors.textSecondary }]}>
                Hidden API Bypass
              </Text>
            </View>
            <Text style={[styles.diagValue, { color: colors.textPrimary }]}>
              {sysInfo?.hiddenApiBypassed ? 'Unsealed (Android P-15)' : 'Standard'}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.diagRow}>
            <View style={styles.diagLabelGroup}>
              <Smartphone size={16} color={colors.textSecondary} />
              <Text style={[styles.diagLabel, { color: colors.textSecondary }]}>
                Android Release
              </Text>
            </View>
            <Text style={[styles.diagValue, { color: colors.textPrimary }]}>
              Android {sysInfo?.androidRelease || '14'} (SDK {sysInfo?.androidSdk || '34'})
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.diagRow}>
            <View style={styles.diagLabelGroup}>
              <HardDrive size={16} color={colors.textSecondary} />
              <Text style={[styles.diagLabel, { color: colors.textSecondary }]}>
                Sandbox Root
              </Text>
            </View>
            <Text style={[styles.diagValue, { color: colors.textPrimary }]} numberOfLines={1}>
              {sysInfo?.sandboxDirectory || '/files/twinspace/virtual'}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.diagRow}>
            <View style={styles.diagLabelGroup}>
              <Layers size={16} color={colors.textSecondary} />
              <Text style={[styles.diagLabel, { color: colors.textSecondary }]}>
                Active Cloned Spaces
              </Text>
            </View>
            <Text style={[styles.diagValue, { color: colors.textPrimary }]}>
              {clonedApps.length} Instances
            </Text>
          </View>
        </View>

        {/* About Card */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>About TwinSpace</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 20 }]}>
          <View style={styles.aboutHeader}>
            <View style={[styles.logoBox, { backgroundColor: colors.primaryGlow }]}>
              <Layers size={28} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>TwinSpace</Text>
              <Text style={[styles.aboutTagline, { color: colors.accent }]}>
                Your apps. Another space.
              </Text>
              <Text style={[styles.aboutVersion, { color: colors.textMuted }]}>
                Version 1.0.0 • Personal Edition
              </Text>
            </View>
          </View>

          <Text style={[styles.aboutDesc, { color: colors.textSecondary }]}>
            TwinSpace is a personal Android application virtualization and cloning platform. It enables running separate instances of installed applications (such as ChatGPT) with 100% independent login sessions, local storage, databases, and preferences.
          </Text>

          <View style={[styles.guaranteeBanner, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <ShieldCheck size={18} color={colors.success} style={{ marginRight: 10, marginTop: 2 }} />
            <Text style={[styles.guaranteeText, { color: colors.textSecondary }]}>
              100% Ad-Free • No In-App Purchases • Completely Local Execution Guarantee
            </Text>
          </View>
        </View>
      </ScrollView>
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  themeLabel: {
    fontSize: 15,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  divider: {
    height: 1,
    marginLeft: 62,
  },
  diagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  diagLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  diagLabel: {
    fontSize: 14,
  },
  diagValue: {
    fontSize: 13.5,
    fontWeight: '600',
    maxWidth: '50%',
    textAlign: 'right',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  aboutTagline: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  aboutVersion: {
    fontSize: 11.5,
    marginTop: 2,
  },
  aboutDesc: {
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 16,
  },
  guaranteeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  guaranteeText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
});
