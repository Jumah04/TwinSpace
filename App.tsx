import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { TwinSpaceProvider, useTwinSpace } from './src/context/TwinSpaceContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { AddAppsScreen } from './src/screens/AddAppsScreen';
import { AppDetailScreen } from './src/screens/AppDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { Layers, PlusCircle, Settings as SettingsIcon } from 'lucide-react-native';

const MainNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { activeScreen, setActiveScreen, clonedApps } = useTwinSpace();
  const insets = useSafeAreaInsets();

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen />;
      case 'add':
        return <AddAppsScreen />;
      case 'detail':
        return <AppDetailScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const showBottomNav = activeScreen === 'home' || activeScreen === 'add' || activeScreen === 'settings';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />

      <View style={styles.screenWrapper}>{renderScreen()}</View>

      {/* Modern Bottom Navigation Bar */}
      {showBottomNav && (
        <View
          style={[
            styles.bottomNav,
            {
              backgroundColor: colors.tabBarBg,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 10),
            },
          ]}
        >
          {/* Home / Spaces Tab */}
          <TouchableOpacity
            style={styles.navTab}
            onPress={() => setActiveScreen('home')}
            activeOpacity={0.7}
          >
            <View style={styles.tabIconContainer}>
              <Layers
                size={22}
                color={activeScreen === 'home' ? colors.tabBarActive : colors.tabBarInactive}
              />
              {clonedApps.length > 0 && (
                <View style={[styles.badgePill, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{clonedApps.length}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.navLabel,
                {
                  color: activeScreen === 'home' ? colors.tabBarActive : colors.tabBarInactive,
                  fontWeight: activeScreen === 'home' ? '700' : '500',
                },
              ]}
            >
              My Spaces
            </Text>
          </TouchableOpacity>

          {/* Add / Clone Tab */}
          <TouchableOpacity
            style={styles.navTab}
            onPress={() => setActiveScreen('add')}
            activeOpacity={0.7}
          >
            <PlusCircle
              size={22}
              color={activeScreen === 'add' ? colors.tabBarActive : colors.tabBarInactive}
            />
            <Text
              style={[
                styles.navLabel,
                {
                  color: activeScreen === 'add' ? colors.tabBarActive : colors.tabBarInactive,
                  fontWeight: activeScreen === 'add' ? '700' : '500',
                },
              ]}
            >
              Clone App
            </Text>
          </TouchableOpacity>

          {/* Settings Tab */}
          <TouchableOpacity
            style={styles.navTab}
            onPress={() => setActiveScreen('settings')}
            activeOpacity={0.7}
          >
            <SettingsIcon
              size={22}
              color={activeScreen === 'settings' ? colors.tabBarActive : colors.tabBarInactive}
            />
            <Text
              style={[
                styles.navLabel,
                {
                  color: activeScreen === 'settings' ? colors.tabBarActive : colors.tabBarInactive,
                  fontWeight: activeScreen === 'settings' ? '700' : '500',
                },
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TwinSpaceProvider>
          <MainNavigator />
        </TwinSpaceProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    elevation: 12,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    position: 'relative',
  },
  badgePill: {
    position: 'absolute',
    top: -5,
    right: -10,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  navLabel: {
    fontSize: 11.5,
    marginTop: 4,
  },
});
