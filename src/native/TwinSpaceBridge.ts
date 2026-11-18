import { NativeModules, Platform } from 'react-native';
import {
  InstalledApp,
  ClonedApp,
  StorageInfo,
  SystemVirtualizationInfo,
} from '../types';

const { TwinSpaceModule } = NativeModules;

// In-memory mock storage for development/test environment without native APK build
let mockClones: ClonedApp[] = [
  {
    id: 'com.openai.chatgpt_0',
    packageName: 'com.openai.chatgpt',
    appName: 'ChatGPT',
    userId: 0,
    alias: 'ChatGPT (Space 1)',
    iconUri: '',
    sourceDir: '/data/app/com.openai.chatgpt/base.apk',
    createdAt: Date.now() - 3600000,
    lastLaunchedAt: Date.now() - 900000,
  },
];

const mockInstalledApps: InstalledApp[] = [
  {
    packageName: 'com.openai.chatgpt',
    appName: 'ChatGPT',
    versionName: '1.2024.312',
    versionCode: 2024312,
    isSystem: false,
    iconUri: '',
    apkSize: 68420000,
    cloneCount: 1,
  },
  {
    packageName: 'com.whatsapp',
    appName: 'WhatsApp Messenger',
    versionName: '2.24.22.79',
    versionCode: 242279,
    isSystem: false,
    iconUri: '',
    apkSize: 74210000,
    cloneCount: 0,
  },
  {
    packageName: 'org.telegram.messenger',
    appName: 'Telegram',
    versionName: '10.14.5',
    versionCode: 101450,
    isSystem: false,
    iconUri: '',
    apkSize: 85900000,
    cloneCount: 0,
  },
  {
    packageName: 'com.twitter.android',
    appName: 'X',
    versionName: '10.60.0',
    versionCode: 106000,
    isSystem: false,
    iconUri: '',
    apkSize: 92300000,
    cloneCount: 0,
  },
  {
    packageName: 'com.google.android.youtube',
    appName: 'YouTube',
    versionName: '19.42.34',
    versionCode: 194234,
    isSystem: true,
    iconUri: '',
    apkSize: 110400000,
    cloneCount: 0,
  },
];

export const TwinSpaceBridge = {
  isNativeAvailable(): boolean {
    return Platform.OS === 'android' && Boolean(TwinSpaceModule);
  },

  async getInstalledApps(includeSystem: boolean = false): Promise<InstalledApp[]> {
    if (this.isNativeAvailable()) {
      return await TwinSpaceModule.getInstalledApps(includeSystem);
    }
    // Development fallback
    return mockInstalledApps.filter((a) => includeSystem || !a.isSystem);
  },

  async getClonedApps(): Promise<ClonedApp[]> {
    if (this.isNativeAvailable()) {
      return await TwinSpaceModule.getClonedApps();
    }
    return [...mockClones];
  },

  async cloneApp(packageName: String, alias?: string): Promise<ClonedApp> {
    if (this.isNativeAvailable()) {
      return await TwinSpaceModule.cloneApp(packageName, alias || null);
    }
    const app = mockInstalledApps.find((a) => a.packageName === packageName);
    const existing = mockClones.filter((c) => c.packageName === packageName);
    const nextUserId = existing.length;
    const newClone: ClonedApp = {
      id: `${packageName}_${nextUserId}`,
      packageName: packageName as string,
      appName: app?.appName || (packageName as string),
      userId: nextUserId,
      alias: alias || `${app?.appName || packageName} (Space ${nextUserId + 1})`,
      iconUri: '',
      sourceDir: `/data/app/${packageName}/base.apk`,
      createdAt: Date.now(),
      lastLaunchedAt: 0,
    };
    mockClones.push(newClone);
    if (app) app.cloneCount += 1;
    return newClone;
  },

  async launchClone(cloneId: string): Promise<boolean> {
    if (this.isNativeAvailable()) {
      return await TwinSpaceModule.launchClone(cloneId);
    }
    const clone = mockClones.find((c) => c.id === cloneId);
    if (clone) {
      clone.lastLaunchedAt = Date.now();
    }
    return true;
  },

  async removeClone(cloneId: string): Promise<boolean> {
    if (this.isNativeAvailable()) {
      return await TwinSpaceModule.removeClone(cloneId);
    }
    const idx = mockClones.findIndex((c) => c.id === cloneId);
    if (idx !== -1) {
      const removed = mockClones.splice(idx, 1)[0];
      const app = mockInstalledApps.find((a) => a.packageName === removed.packageName);
      if (app && app.cloneCount > 0) app.cloneCount -= 1;
      return true;
    }
    return false;
  },

  async createHomeScreenShortcut(cloneId: string): Promise<boolean> {
    if (this.isNativeAvailable()) {
      return await TwinSpaceModule.createHomeScreenShortcut(cloneId);
    }
    return true;
  },

  async getCloneStorageInfo(cloneId: string): Promise<StorageInfo> {
    if (this.isNativeAvailable()) {
      return await TwinSpaceModule.getCloneStorageInfo(cloneId);
    }
    return {
      totalBytes: 14250000,
      appDataBytes: 8120000,
      cacheBytes: 4210000,
      databaseBytes: 1540000,
      sharedPrefsBytes: 380000,
    };
  },

  async clearCloneCache(cloneId: string): Promise<boolean> {
    if (this.isNativeAvailable()) {
      return await TwinSpaceModule.clearCloneCache(cloneId);
    }
    return true;
  },

  async clearCloneData(cloneId: string): Promise<boolean> {
    if (this.isNativeAvailable()) {
      return await TwinSpaceModule.clearCloneData(cloneId);
    }
    return true;
  },

  async getSystemVirtualizationInfo(): Promise<SystemVirtualizationInfo> {
    if (this.isNativeAvailable()) {
      return await TwinSpaceModule.getSystemVirtualizationInfo();
    }
    return {
      androidSdk: 34,
      deviceModel: 'Android Device (TwinSpace Engine)',
      androidRelease: '14.0',
      hiddenApiBypassed: true,
      isRootRequired: false,
      totalClonesCount: mockClones.length,
      sandboxDirectory: '/data/user/0/com.twinspace.app/files/twinspace/virtual',
    };
  },
};
