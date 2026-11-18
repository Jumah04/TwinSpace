import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ClonedApp } from '../types';
import { Play, MoreVertical, Smartphone, HardDrive, Trash2 } from 'lucide-react-native';

interface ClonedAppCardProps {
  clone: ClonedApp;
  onLaunch: (clone: ClonedApp) => void;
  onManage: (clone: ClonedApp) => void;
  onShortcut: (clone: ClonedApp) => void;
  onRemove: (clone: ClonedApp) => void;
}

export const ClonedAppCard: React.FC<ClonedAppCardProps> = ({
  clone,
  onLaunch,
  onManage,
  onShortcut,
  onRemove,
}) => {
  const { colors } = useTheme();

  const formatLastActive = (timestamp: number) => {
    if (!timestamp) return 'Never launched';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Active just now';
    if (mins < 60) return `Active ${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Active ${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `Active ${days}d ago`;
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.mainContent}
        onPress={() => onManage(clone)}
        activeOpacity={0.8}
      >
        {/* App Icon Container with Badge */}
        <View style={styles.iconWrapper}>
          {clone.iconUri ? (
            <Image source={{ uri: clone.iconUri }} style={styles.appIcon} />
          ) : (
            <View style={[styles.fallbackIcon, { backgroundColor: colors.primaryGlow }]}>
              <Text style={[styles.fallbackText, { color: colors.primary }]}>
                {clone.appName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}

          {/* User space badge pill */}
          <View style={[styles.spaceBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.spaceBadgeText}>S{clone.userId + 1}</Text>
          </View>
        </View>

        {/* App Info Column */}
        <View style={styles.infoColumn}>
          <Text style={[styles.appName, { color: colors.textPrimary }]} numberOfLines={1}>
            {clone.alias}
          </Text>
          <Text style={[styles.packageName, { color: colors.textMuted }]} numberOfLines={1}>
            {clone.packageName}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.lastActiveText, { color: colors.textSecondary }]}>
              {formatLastActive(clone.lastLaunchedAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Row */}
      <View style={[styles.actionRow, { borderTopColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[styles.shortcutBtn, { backgroundColor: colors.surface }]}
          onPress={() => onShortcut(clone)}
          activeOpacity={0.7}
        >
          <Smartphone size={15} color={colors.textSecondary} />
          <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Shortcut</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.manageBtn, { backgroundColor: colors.surface }]}
          onPress={() => onManage(clone)}
          activeOpacity={0.7}
        >
          <HardDrive size={15} color={colors.textSecondary} />
          <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Manage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.launchBtn, { backgroundColor: colors.primary }]}
          onPress={() => onLaunch(clone)}
          activeOpacity={0.8}
        >
          <Play size={15} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.launchBtnText}>Open</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 7,
    overflow: 'hidden',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  appIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  fallbackIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: '700',
  },
  spaceBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  spaceBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  infoColumn: {
    flex: 1,
  },
  appName: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  packageName: {
    fontSize: 12.5,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  lastActiveText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  shortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
  },
  launchBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
