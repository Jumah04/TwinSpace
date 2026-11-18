# TwinSpace 📱✨
> **Your apps. Another space.**
> *A personal, ad-free Android application virtualization and cloning platform built with Expo, React Native (TypeScript), and native Kotlin.*

---

## 1. Overview

**TwinSpace** is an Android application cloning and virtualization solution inspired by Parallel Space, engineered specifically for personal, private use on your Android phone without advertisements, trackers, or subscriptions.

Its primary purpose is to allow you to create independent instances of existing applications installed on your phone (such as the official **ChatGPT** Android app from Google Play) and run them with completely separate accounts, local databases, preferences, and session tokens.

### Key Highlights
- **100% Genuine Virtualization:** Does not use WebViews or app shortcuts to original instances. Each clone executes in an isolated userspace sandbox with redirected storage paths.
- **Data & Account Independence:** Login sessions, auth tokens, cache, SQLite databases, and user preferences are isolated under `/data/data/com.twinspace.app/files/twinspace/virtual/users/<userId>/<package>/`.
- **Untouched Original Application:** The original Play Store application and its data remain completely isolated and unmodified.
- **Multiple Instances Supported:** Create multiple spaces of the same app (Space 1, Space 2, Space 3).
- **Home Screen Shortcuts:** Pin badged shortcuts directly to your Android launcher to open cloned instances with a single tap.
- **Zero Local Android Studio Requirement:** Build the standalone APK directly using EAS Cloud Build or the Gradle CLI.

---

## 2. Technical Virtualization Architecture

```
                                  +---------------------------------------+
                                  |         TwinSpace Frontend            |
                                  |     (React Native / TypeScript)       |
                                  +-------------------+-------------------+
                                                      |
                                    JNI / Native Module Bridge
                                    (TwinSpaceModule.kt)
                                                      |
                                  +-------------------v-------------------+
                                  |         TwinVirtualEngine             |
                                  |          (Kotlin Core)                |
                                  +---------+---------+---------+---------+
                                            |         |         |
                  +-------------------------+         |         +-------------------------+
                  |                                   |                                   |
    +-------------v-------------+       +-------------v-------------+       +-------------v-------------+
    |    TwinSandboxManager     |       |      TwinClassLoader      |       |    TwinResourceManager    |
    |  Physical Data Isolation  |       |   Dynamic APK Classloader |       |  Asset & Resource Injection|
    |  • SQLite databases       |       |  • DexClassLoader         |       |  • Dynamic AssetManager   |
    |  • SharedPreferences      |       |  • Split APKs             |       |  • Theme Resolution       |
    |  • Internal / External    |       |  • Native Libraries (.so) |       |  • Layout & Drawables     |
    +---------------------------+       +---------------------------+       +---------------------------+
                  |                                   |                                   |
                  +-------------------------+---------+-----------------------------------+
                                            |
                                  +---------v---------+
                                  | TwinVirtualContext| (ContextWrapper intercepting storage)
                                  +---------+---------+
                                            |
                                  +---------v---------+
                                  |TwinContainerActivity|
                                  | (Stub Activity)   |
                                  | Process: :virtual0|
                                  +-------------------+
```

### Core Virtualization Components
1. **`TwinHiddenApiBypass.kt`**:
   Bypasses Android 9 through Android 15 Hidden API restrictions using meta-reflection (`dalvik.system.VMRuntime.setHiddenApiExemptions`), allowing safe access to `ActivityThread` and `Instrumentation`.
2. **`TwinSandboxManager.kt`**:
   Creates and manages isolated directory trees on physical disk:
   `/data/data/com.twinspace.app/files/twinspace/virtual/users/<userId>/<packageName>/`
   - `data/files/`
   - `data/cache/`
   - `data/databases/`
   - `data/shared_prefs/`
   - `data/code_cache/`
3. **`TwinVirtualContext.kt`**:
   A custom `ContextWrapper` intercepting every read and write to `getFilesDir()`, `getCacheDir()`, `getDataDir()`, `getDatabasePath()`, and `getSharedPreferences()`. All operations are redirected into the user's virtual sandbox.
4. **`TwinClassLoader.kt`**:
   Dynamically loads the installed application's compiled bytecode (`sourceDir`) and native libraries (`nativeLibraryDir`) using `DexClassLoader`.
5. **`TwinResourceManager.kt`**:
   Extracts and injects the guest application's XML layouts, styles, and resources via dynamic `AssetManager.addAssetPath`.
6. **`TwinShortcutManager.kt`**:
   Uses `ShortcutManagerCompat` to pin launcher shortcuts equipped with custom badged icons (showing the TwinSpace dual-ring emblem and instance number).
7. **`TwinContainerActivity.kt` & Stub Activities**:
   Acts as the secure container running in secondary processes (`:twin_virtual0`), isolating memory and crashes from the main manager UI.

---

## 3. Project Structure

```
TwinSpace/
├── App.tsx                              # Main navigation & UI root
├── app.json                             # Expo application configuration & permissions
├── package.json                         # Dependencies & npm scripts
├── tsconfig.json                        # TypeScript configuration
├── eas.json                             # EAS Cloud Build profile (generates APK)
├── plugins/
│   └── withTwinSpace.js                 # Expo Config Plugin for Android manifest
├── assets/
│   ├── icon.png                         # TwinSpace application icon
│   ├── adaptive-icon.png                # Android adaptive launcher icon
│   └── splash.png                       # Splash screen branding
├── src/
│   ├── types/
│   │   └── index.ts                     # TypeScript data models
│   ├── theme/
│   │   ├── colors.ts                    # Light & dark theme palettes
│   │   └── ThemeContext.tsx             # Theme provider & hooks
│   ├── native/
│   │   └── TwinSpaceBridge.ts           # Type-safe native module bridge
│   ├── context/
│   │   └── TwinSpaceContext.tsx         # Global state & virtualization management
│   ├── components/
│   │   ├── Header.tsx                   # Top bar navigation component
│   │   ├── SearchBar.tsx                # Instant search filter
│   │   ├── ClonedAppCard.tsx            # Cloned space item card
│   │   ├── InstalledAppCard.tsx         # App discovery item card
│   │   ├── CloneModal.tsx               # Clone confirmation modal
│   │   ├── ConfirmationModal.tsx        # Reusable modal for destructive actions
│   │   └── StorageBar.tsx               # Storage breakdown indicator
│   └── screens/
│       ├── HomeScreen.tsx               # Displays all cloned spaces
│       ├── AddAppsScreen.tsx            # Discovers installed apps on device
│       ├── AppDetailScreen.tsx          # Manage storage, clear data, pin shortcuts
│       └── SettingsScreen.tsx           # Theme & virtualization engine diagnostics
└── android/
    ├── build.gradle                     # Top-level Gradle build configuration
    ├── settings.gradle                  # Gradle settings
    ├── gradlew / gradlew.bat            # Gradle wrapper executable
    └── app/
        ├── build.gradle                 # Android application build configuration
        ├── proguard-rules.pro           # R8 / Proguard reflection rules
        └── src/main/
            ├── AndroidManifest.xml      # Manifest with permissions & stub activities
            ├── res/                     # Android styles, colors, and XML configs
            └── java/com/twinspace/
                ├── app/
                │   ├── MainActivity.kt  # Host React Native Activity
                │   └── MainApplication.kt
                └── virtual/
                    ├── core/
                    │   ├── TwinVirtualEngine.kt
                    │   ├── TwinSandboxManager.kt
                    │   ├── TwinClassLoader.kt
                    │   ├── TwinResourceManager.kt
                    │   ├── TwinVirtualContext.kt
                    │   ├── TwinInstrumentation.kt
                    │   └── TwinHiddenApiBypass.kt
                    ├── stub/
                    │   ├── TwinContainerActivity.kt
                    │   └── StubActivities.kt
                    ├── shortcut/
                    │   └── TwinShortcutManager.kt
                    └── bridge/
                        ├── TwinSpaceModule.kt
                        └── TwinSpacePackage.kt
```

---

## 4. How to Build the APK (Without Android Studio)

You do **NOT** need to install Android Studio or full Android SDKs locally. Choose one of the two options below:

### Option A: EAS Cloud Build (Recommended — 100% Free & Fast)

Expo Application Services (EAS) compiles the APK entirely on remote cloud servers:

1. Install EAS CLI globally (if not already installed):
   ```bash
   npm install -g eas-cli
   ```
2. Log into your free Expo account:
   ```bash
   eas login
   ```
3. Run the APK build command:
   ```bash
   eas build -p android --profile preview
   ```
4. EAS will build the project in the cloud and provide a direct download link (and QR code) for the `.apk` file.
5. Download the `.apk` file to your phone and install it!

---

### Option B: Local Gradle CLI (If you have a JDK installed)

If you have Java (JDK 17+) installed on your computer, you can compile the APK directly from the command line without opening or installing Android Studio:

```bash
# On Windows PowerShell / Command Prompt:
cd android
.\gradlew.bat assembleRelease

# On macOS / Linux:
cd android
chmod +x gradlew
./gradlew assembleRelease
```

The compiled release APK will be located at:
`android/app/build/outputs/apk/release/app-release.apk`

---

## 5. Using TwinSpace

1. **Open TwinSpace** on your Android phone.
2. Tap the **Clone App** button (or the `+` FAB).
3. TwinSpace automatically discovers all launchable applications installed on your phone (e.g. **ChatGPT**).
4. Tap **Clone** next to ChatGPT.
5. Optionally give the clone a custom name (e.g. `ChatGPT Work` or `ChatGPT Second Account`).
6. Tap **Create Clone**.
7. TwinSpace provisions the isolated sandbox storage directory and registers the clone.
8. Tap **Open** to run your separate ChatGPT instance!
9. Tap **Shortcut** to add a badged shortcut directly to your phone's home screen for one-tap direct access.
10. Manage or clear cache and databases at any time in the **Manage** tab.

---

## 6. Permissions Reference

- `android.permission.QUERY_ALL_PACKAGES`: Allows TwinSpace to discover installed applications on modern Android 11+ (API 30+).
- `android.permission.INSTALL_SHORTCUT`: Allows creating home-screen shortcuts for cloned instances.
- `android.permission.INTERNET` & `ACCESS_NETWORK_STATE`: Enables network connectivity for cloned applications.
- `android.permission.MANAGE_EXTERNAL_STORAGE`: Ensures sandboxed external files and downloads function smoothly.

---

## 7. License

Personal project built exclusively for personal use. Free of tracking, ads, and third-party commercial SDKs.
