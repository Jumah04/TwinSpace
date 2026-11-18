export interface InstalledApp {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  isSystem: boolean;
  iconUri: string;
  apkSize: number;
  cloneCount: number;
}

export interface ClonedApp {
  id: string;
  packageName: string;
  appName: string;
  userId: number;
  alias: string;
  iconUri: string;
  sourceDir: string;
  createdAt: number;
  lastLaunchedAt: number;
}

export interface StorageInfo {
  totalBytes: number;
  appDataBytes: number;
  cacheBytes: number;
  databaseBytes: number;
  sharedPrefsBytes: number;
}

export interface SystemVirtualizationInfo {
  androidSdk: number;
  deviceModel: string;
  androidRelease: string;
  hiddenApiBypassed: boolean;
  isRootRequired: boolean;
  totalClonesCount: number;
  sandboxDirectory: string;
}

export type ThemeMode = 'dark' | 'light' | 'system';

export type ScreenType = 'home' | 'add' | 'detail' | 'settings';
