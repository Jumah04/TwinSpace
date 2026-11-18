import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { StorageInfo } from '../types';

interface StorageBarProps {
  storage: StorageInfo;
}

export const StorageBar: React.FC<StorageBarProps> = ({ storage }) => {
  const { colors } = useTheme();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const total = Math.max(storage.totalBytes, 1);
  const dataPercent = Math.max((storage.appDataBytes / total) * 100, 2);
  const cachePercent = Math.max((storage.cacheBytes / total) * 100, 2);
  const dbPercent = Math.max((storage.databaseBytes / total) * 100, 2);
  const spPercent = Math.max((storage.sharedPrefsBytes / total) * 100, 2);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Virtual Sandbox Storage</Text>
        <Text style={[styles.totalText, { color: colors.primary }]}>
          {formatBytes(storage.totalBytes)}
        </Text>
      </View>

      {/* Multi-segmented Progress Bar */}
      <View style={[styles.barWrapper, { backgroundColor: colors.surface }]}>
        <View style={[styles.segment, { width: `${dataPercent}%`, backgroundColor: '#6366F1' }]} />
        <View style={[styles.segment, { width: `${cachePercent}%`, backgroundColor: '#38BDF8' }]} />
        <View style={[styles.segment, { width: `${dbPercent}%`, backgroundColor: '#10B981' }]} />
        <View style={[styles.segment, { width: `${spPercent}%`, backgroundColor: '#F59E0B' }]} />
      </View>

      {/* Legend Grid */}
      <View style={styles.legendGrid}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>App Data</Text>
          <Text style={[styles.legendValue, { color: colors.textPrimary }]}>
            {formatBytes(storage.appDataBytes)}
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Cache</Text>
          <Text style={[styles.legendValue, { color: colors.textPrimary }]}>
            {formatBytes(storage.cacheBytes)}
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Databases</Text>
          <Text style={[styles.legendValue, { color: colors.textPrimary }]}>
            {formatBytes(storage.databaseBytes)}
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Preferences</Text>
          <Text style={[styles.legendValue, { color: colors.textPrimary }]}>
            {formatBytes(storage.sharedPrefsBytes)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalText: {
    fontSize: 15,
    fontWeight: '800',
  },
  barWrapper: {
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  segment: {
    height: '100%',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
  },
  legendLabel: {
    fontSize: 12,
    flex: 1,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '700',
  },
});
