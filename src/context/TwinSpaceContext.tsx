import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert, ToastAndroid, Platform } from 'react-native';
import {
  InstalledApp,
  ClonedApp,
  StorageInfo,
  SystemVirtualizationInfo,
  ScreenType,
} from '../types';
import { TwinSpaceBridge } from '../native/TwinSpaceBridge';

interface TwinSpaceContextType {
  installedApps: InstalledApp[];
  clonedApps: ClonedApp[];
  selectedClone: ClonedApp | null;
  isLoading: boolean;
  isRefreshing: boolean;
  includeSystemApps: boolean;
  sysInfo: SystemVirtualizationInfo | null;
  activeScreen: ScreenType;
  setActiveScreen: (screen: ScreenType) => void;
  setSelectedClone: (clone: ClonedApp | null) => void;
  setIncludeSystemApps: (include: boolean) => void;
  loadAllData: () => Promise<void>;
  cloneApp: (packageName: string, alias?: string) => Promise<ClonedApp | null>;
  launchClone: (cloneId: string) => Promise<boolean>;
  removeClone: (cloneId: string) => Promise<boolean>;
  createShortcut: (cloneId: string) => Promise<boolean>;
  clearCache: (cloneId: string) => Promise<boolean>;
  clearData: (cloneId: string) => Promise<boolean>;
  getStorageInfo: (cloneId: string) => Promise<StorageInfo>;
}

const TwinSpaceContext = createContext<TwinSpaceContextType | null>(null);

export const TwinSpaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [clonedApps, setClonedApps] = useState<ClonedApp[]>([]);
  const [selectedClone, setSelectedClone] = useState<ClonedApp | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [includeSystemApps, setIncludeSystemApps] = useState(false);
  const [sysInfo, setSysInfo] = useState<SystemVirtualizationInfo | null>(null);
  const [activeScreen, setActiveScreen] = useState<ScreenType>('home');

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  };

  const loadAllData = useCallback(async () => {
    try {
      const [installed, cloned, system] = await Promise.all([
        TwinSpaceBridge.getInstalledApps(includeSystemApps),
        TwinSpaceBridge.getClonedApps(),
        TwinSpaceBridge.getSystemVirtualizationInfo(),
      ]);

      setInstalledApps(installed);
      setClonedApps(cloned);
      setSysInfo(system);
    } catch (e: any) {
      console.error('Failed to load TwinSpace data', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [includeSystemApps]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleCloneApp = async (packageName: string, alias?: string): Promise<ClonedApp | null> => {
    try {
      setIsLoading(true);
      const newClone = await TwinSpaceBridge.cloneApp(packageName, alias);
      await loadAllData();
      showToast(`Created ${newClone.alias}`);
      return newClone;
    } catch (e: any) {
      Alert.alert('Clone Failed', e.message || 'Unable to clone application');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchClone = async (cloneId: string): Promise<boolean> => {
    try {
      const ok = await TwinSpaceBridge.launchClone(cloneId);
      if (ok) {
        // Refresh last launched timestamp
        const updated = await TwinSpaceBridge.getClonedApps();
        setClonedApps(updated);
      }
      return ok;
    } catch (e: any) {
      Alert.alert('Launch Failed', e.message || 'Could not launch cloned instance');
      return false;
    }
  };

  const handleRemoveClone = async (cloneId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const ok = await TwinSpaceBridge.removeClone(cloneId);
      if (ok) {
        if (selectedClone?.id === cloneId) {
          setSelectedClone(null);
          setActiveScreen('home');
        }
        await loadAllData();
        showToast('Clone and sandbox data removed');
      }
      return ok;
    } catch (e: any) {
      Alert.alert('Removal Failed', e.message || 'Could not remove cloned instance');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShortcut = async (cloneId: string): Promise<boolean> => {
    try {
      const ok = await TwinSpaceBridge.createHomeScreenShortcut(cloneId);
      if (ok) {
        showToast('Shortcut pinned to home screen');
      } else {
        Alert.alert(
          'Shortcut Notice',
          'Your launcher did not respond to shortcut pinning request, or permission is needed in Launcher settings.'
        );
      }
      return ok;
    } catch (e: any) {
      Alert.alert('Shortcut Error', e.message || 'Failed to create shortcut');
      return false;
    }
  };

  const handleClearCache = async (cloneId: string): Promise<boolean> => {
    try {
      const ok = await TwinSpaceBridge.clearCloneCache(cloneId);
      if (ok) {
        showToast('Cache cleared successfully');
      }
      return ok;
    } catch (e: any) {
      Alert.alert('Clear Cache Error', e.message || 'Failed to clear cache');
      return false;
    }
  };

  const handleClearData = async (cloneId: string): Promise<boolean> => {
    try {
      const ok = await TwinSpaceBridge.clearCloneData(cloneId);
      if (ok) {
        showToast('All clone session data reset');
      }
      return ok;
    } catch (e: any) {
      Alert.alert('Reset Data Error', e.message || 'Failed to reset clone data');
      return false;
    }
  };

  const handleGetStorageInfo = async (cloneId: string): Promise<StorageInfo> => {
    return await TwinSpaceBridge.getCloneStorageInfo(cloneId);
  };

  return (
    <TwinSpaceContext.Provider
      value={{
        installedApps,
        clonedApps,
        selectedClone,
        isLoading,
        isRefreshing,
        includeSystemApps,
        sysInfo,
        activeScreen,
        setActiveScreen,
        setSelectedClone,
        setIncludeSystemApps,
        loadAllData,
        cloneApp: handleCloneApp,
        launchClone: handleLaunchClone,
        removeClone: handleRemoveClone,
        createShortcut: handleCreateShortcut,
        clearCache: handleClearCache,
        clearData: handleClearData,
        getStorageInfo: handleGetStorageInfo,
      }}
    >
      {children}
    </TwinSpaceContext.Provider>
  );
};

export const useTwinSpace = () => {
  const context = useContext(TwinSpaceContext);
  if (!context) {
    throw new Error('useTwinSpace must be used within a TwinSpaceProvider');
  }
  return context;
};
