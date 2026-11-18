const { withAndroidManifest, withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for TwinSpace:
 * Automatically configures AndroidManifest.xml with virtualization stub activities,
 * package discovery permissions, and network security parameters during `npx expo prebuild`.
 */
const withTwinSpace = (config) => {
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Ensure permissions
    const permissions = [
      'android.permission.QUERY_ALL_PACKAGES',
      'android.permission.INSTALL_SHORTCUT',
      'com.android.launcher.permission.INSTALL_SHORTCUT',
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.VIBRATE',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.REQUEST_INSTALL_PACKAGES',
    ];

    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    permissions.forEach((perm) => {
      const exists = androidManifest['uses-permission'].some(
        (p) => p.$['android:name'] === perm
      );
      if (!exists) {
        androidManifest['uses-permission'].push({
          $: { 'android:name': perm },
        });
      }
    });

    return config;
  });

  return config;
};

module.exports = withTwinSpace;
