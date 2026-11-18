import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { InstalledApp } from '../types';
import { Copy, Check, ShieldAlert } from 'lucide-react-native';

interface InstalledAppCardProps {
  app: InstalledApp;
  onClone: (app: InstalledApp) => void;
}

export const InstalledAppCard: React.FC<InstalledAppCardProps> = ({ app, onClone }) => {
  const { colors } = useTheme();

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    return `${mb} MB`;
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.content}>
        {/* App Icon */}
        {app.iconUri ? (
          <Image source={{ uri: app.iconUri }} style={styles.appIcon} />
        ) : (
          <View style={[styles.fallbackIcon, { backgroundColor: colors.primaryGlow }]}>
            <Text style={[styles.fallbackText, { color: colors.primary }]}>
              {app.appName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Info Column */}
        <View style={styles.infoColumn}>
          <View style={styles.nameRow}>
            <Text style={[styles.appName, { color: colors.textPrimary }]} numberOfLines={1}>
              {app.appName}
            </Text>
            {app.isSystem && (
              <View style={[styles.systemBadge, { backgroundColor: colors.badgeBg }]}>
                <ShieldAlert size={11} color={colors.warning} />
                <Text style={[styles.systemText, { color: colors.warning }]}>System</Text>
              </View>
            )}
          </View>

          <Text style={[styles.packageName, { color: colors.textMuted }]} numberOfLines={1}>
            {app.packageName}
          </Text>

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>v{app.versionName}</Text>
            {app.apkSize > 0 && (
              <>
                <Text style={[styles.bullet, { color: colors.textMuted }]}>•</Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {formatSize(app.apkSize)}
                </Text>
              </>
            )}
            {app.cloneCount > 0 && (
              <>
                <Text style={[styles.bullet, { color: colors.textMuted }]}>•</Text>
                <View style={[styles.clonedTag, { backgroundColor: colors.accentGlow }]}>
                  <Text style={[styles.clonedTagText, { color: colors.accent }]}>
                    {app.cloneCount} {app.cloneCount === 1 ? 'Clone' : 'Clones'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Clone Action Button */}
        <TouchableOpacity
          style={[styles.cloneBtn, { backgroundColor: colors.primary }]}
          onPress={() => onClone(app)}
          activeOpacity={0.8}
        >
          <Copy size={14} color="#FFFFFF" />
          <Text style={styles.cloneBtnText}>Clone</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 14,
  },
  fallbackIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoColumn: {
    flex: 1,
    marginRight: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 15.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
    gap: 3,
  },
  systemText: {
    fontSize: 10,
    fontWeight: '600',
  },
  packageName: {
    fontSize: 12,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 11.5,
  },
  bullet: {
    marginHorizontal: 5,
    fontSize: 10,
  },
  clonedTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  clonedTagText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  cloneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 5,
  },
  cloneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
