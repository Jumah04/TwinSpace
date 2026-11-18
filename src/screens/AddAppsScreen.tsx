import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Switch,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useTwinSpace } from '../context/TwinSpaceContext';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { InstalledAppCard } from '../components/InstalledAppCard';
import { CloneModal } from '../components/CloneModal';
import { InstalledApp } from '../types';
import { Sparkles, Shield } from 'lucide-react-native';

export const AddAppsScreen: React.FC = () => {
  const { colors } = useTheme();
  const {
    installedApps,
    isLoading,
    includeSystemApps,
    setIncludeSystemApps,
    cloneApp,
    setActiveScreen,
    loadAllData,
  } = useTwinSpace();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppToClone, setSelectedAppToClone] = useState<InstalledApp | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  const filteredApps = installedApps.filter((a) => {
    const q = searchQuery.toLowerCase();
    return a.appName.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q);
  });

  const handleConfirmClone = async (packageName: string, alias: string) => {
    setIsCloning(true);
    const created = await cloneApp(packageName, alias);
    setIsCloning(false);
    setSelectedAppToClone(null);
    if (created) {
      setActiveScreen('home');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Add Applications"
        subtitle="Select an app installed on your phone to clone"
        showBack
        onBack={() => setActiveScreen('home')}
        onRefresh={loadAllData}
        isRefreshing={isLoading}
      />

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search installed applications..."
      />

      {/* System Apps Toggle Row */}
      <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.filterTextRow}>
          <Shield size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
            Show System Applications
          </Text>
        </View>
        <Switch
          value={includeSystemApps}
          onValueChange={setIncludeSystemApps}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* App List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Scanning installed applications...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredApps}
          keyExtractor={(item) => item.packageName}
          renderItem={({ item }) => (
            <InstalledAppCard app={item} onClone={(app) => setSelectedAppToClone(app)} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No applications found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery
                  ? `No applications matched "${searchQuery}"`
                  : 'No installed applications could be discovered on this device.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Clone Confirmation Modal */}
      <CloneModal
        visible={Boolean(selectedAppToClone)}
        app={selectedAppToClone}
        onClose={() => setSelectedAppToClone(null)}
        onConfirm={handleConfirmClone}
        isCloning={isCloning}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13.5,
    textAlign: 'center',
  },
});
