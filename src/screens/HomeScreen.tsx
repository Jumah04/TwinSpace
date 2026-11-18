import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useTwinSpace } from '../context/TwinSpaceContext';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { ClonedAppCard } from '../components/ClonedAppCard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ClonedApp } from '../types';
import { Plus, Layers, Sparkles } from 'lucide-react-native';

export const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const {
    clonedApps,
    isRefreshing,
    loadAllData,
    launchClone,
    removeClone,
    createShortcut,
    setSelectedClone,
    setActiveScreen,
  } = useTwinSpace();

  const [searchQuery, setSearchQuery] = useState('');
  const [cloneToDelete, setCloneToDelete] = useState<ClonedApp | null>(null);

  const filteredClones = clonedApps.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.alias.toLowerCase().includes(q) || c.packageName.toLowerCase().includes(q);
  });

  const handleLaunch = (clone: ClonedApp) => {
    launchClone(clone.id);
  };

  const handleManage = (clone: ClonedApp) => {
    setSelectedClone(clone);
    setActiveScreen('detail');
  };

  const handleShortcut = (clone: ClonedApp) => {
    createShortcut(clone.id);
  };

  const handleConfirmDelete = async () => {
    if (cloneToDelete) {
      await removeClone(cloneToDelete.id);
      setCloneToDelete(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="TwinSpace"
        subtitle="Your apps. Another space."
        badgeCount={clonedApps.length}
        showSettings
        onSettings={() => setActiveScreen('settings')}
        onRefresh={loadAllData}
        isRefreshing={isRefreshing}
      />

      {clonedApps.length > 0 && (
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Filter your cloned spaces..."
        />
      )}

      <FlatList
        data={filteredClones}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ClonedAppCard
            clone={item}
            onLaunch={handleLaunch}
            onManage={handleManage}
            onShortcut={handleShortcut}
            onRemove={(c) => setCloneToDelete(c)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          filteredClones.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={loadAllData}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryGlow }]}>
              <Layers size={44} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {searchQuery ? 'No matching spaces' : 'No Cloned Apps Yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery
                ? `No cloned spaces match "${searchQuery}"`
                : 'Clone installed applications like ChatGPT to use them with completely separate accounts and independent storage.'}
            </Text>

            {!searchQuery && (
              <TouchableOpacity
                style={[styles.emptyCtaBtn, { backgroundColor: colors.primary }]}
                onPress={() => setActiveScreen('add')}
                activeOpacity={0.8}
              >
                <Sparkles size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.emptyCtaText}>Clone Your First App</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.fabBg, shadowColor: colors.primary }]}
        onPress={() => setActiveScreen('add')}
        activeOpacity={0.85}
      >
        <Plus size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Clone App</Text>
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={Boolean(cloneToDelete)}
        title="Remove Cloned Space?"
        message={`Are you sure you want to remove "${cloneToDelete?.alias}"?\n\nAll independent login sessions, local databases, and cached data for this clone will be permanently deleted. The original application remains untouched.`}
        confirmLabel="Delete Space"
        cancelLabel="Keep Space"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setCloneToDelete(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 4,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 40,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
