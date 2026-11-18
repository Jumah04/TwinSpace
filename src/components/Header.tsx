import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ArrowLeft, Settings, RefreshCw, Layers } from 'lucide-react-native';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSettings?: boolean;
  onSettings?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  badgeCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'TwinSpace',
  subtitle,
  showBack = false,
  onBack,
  showSettings = false,
  onSettings,
  onRefresh,
  isRefreshing = false,
  badgeCount,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.leftRow}>
        {showBack ? (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.card }]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.logoIcon, { backgroundColor: colors.primaryGlow }]}>
            <Layers size={22} color={colors.primary} />
          </View>
        )}

        <View style={styles.titleColumn}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            {badgeCount !== undefined && badgeCount > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.countText}>{badgeCount}</Text>
              </View>
            )}
          </View>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightRow}>
        {onRefresh && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.card }]}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <RefreshCw size={18} color={isRefreshing ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
        )}

        {showSettings && onSettings && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.card }]}
            onPress={onSettings}
            activeOpacity={0.7}
          >
            <Settings size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  titleColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  countBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '400',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
