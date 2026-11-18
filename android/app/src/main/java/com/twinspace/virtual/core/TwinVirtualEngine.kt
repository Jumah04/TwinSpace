package com.twinspace.virtual.core

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.util.Base64
import android.util.Log
import com.twinspace.virtual.shortcut.TwinShortcutManager
import com.twinspace.virtual.stub.TwinContainerActivity
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.ConcurrentHashMap

/**
 * TwinVirtualEngine:
 * Central orchestration engine for TwinSpace.
 * 
 * Manages:
 * 1. Application discovery: Queries installed applications on the device.
 * 2. Virtual sandboxing: Creates and configures isolated data containers per user ID.
 * 3. Dynamic loading: Manages DEX ClassLoader and Resource/Asset injection.
 * 4. Clone lifecycle: Launches, maintains metadata, creates home screen shortcuts,
 *    and monitors virtual storage usage.
 */
class TwinVirtualEngine private constructor(private val appContext: Context) {

    companion object {
        private const val TAG = "TwinVirtualEngine"
        private const val REGISTRY_FILE = "twinspace_clones_registry.json"
        private const val ICONS_DIR = "twinspace/icons"

        @Volatile
        private var instance: TwinVirtualEngine? = null

        fun getInstance(context: Context?): TwinVirtualEngine? {
            if (instance == null && context != null) {
                synchronized(TwinVirtualEngine::class.java) {
                    if (instance == null) {
                        instance = TwinVirtualEngine(context.applicationContext)
                    }
                }
            }
            return instance
        }
    }

    data class ClonedApp(
        val id: String,
        val packageName: String,
        val appName: String,
        val userId: Int,
        val alias: String,
        val iconUri: String,
        val sourceDir: String,
        val createdAt: Long,
        var lastLaunchedAt: Long
    ) {
        fun toJson(): JSONObject = JSONObject().apply {
            put("id", id)
            put("packageName", packageName)
            put("appName", appName)
            put("userId", userId)
            put("alias", alias)
            put("iconUri", iconUri)
            put("sourceDir", sourceDir)
            put("createdAt", createdAt)
            put("lastLaunchedAt", lastLaunchedAt)
        }

        companion object {
            fun fromJson(json: JSONObject): ClonedApp {
                return ClonedApp(
                    id = json.getString("id"),
                    packageName = json.getString("packageName"),
                    appName = json.getString("appName"),
                    userId = json.getInt("userId"),
                    alias = json.optString("alias", json.getString("appName")),
                    iconUri = json.optString("iconUri", ""),
                    sourceDir = json.optString("sourceDir", ""),
                    createdAt = json.optLong("createdAt", System.currentTimeMillis()),
                    lastLaunchedAt = json.optLong("lastLaunchedAt", 0L)
                )
            }
        }
    }

    data class InstalledApp(
        val packageName: String,
        val appName: String,
        val versionName: String,
        val versionCode: Long,
        val isSystem: Boolean,
        val iconUri: String,
        val apkSize: Long,
        val cloneCount: Int
    )

    val sandboxManager = TwinSandboxManager(appContext)
    val classLoaderManager = TwinClassLoader(appContext)
    val resourceManager = TwinResourceManager(appContext)
    val shortcutManager = TwinShortcutManager(appContext)

    private val clonedApps = ConcurrentHashMap<String, ClonedApp>()
    private val iconCache = ConcurrentHashMap<String, String>()

    init {
        initEngine()
        loadClonesRegistry()
    }

    private fun initEngine() {
        Log.i(TAG, "Initializing TwinVirtualEngine...")
        TwinHiddenApiBypass.unseal()
        TwinInstrumentation.install()
    }

    /**
     * Discovers all applications installed on the Android device.
     * Flags system apps and extracts metadata, icons, and clone counts.
     */
    fun getInstalledApps(includeSystem: Boolean = false): List<InstalledApp> {
        val pm = appContext.packageManager
        val packages: List<PackageInfo> = try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                pm.getInstalledPackages(PackageManager.PackageInfoFlags.of(0L))
            } else {
                pm.getInstalledPackages(0)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to retrieve installed packages", e)
            emptyList()
        }

        val result = mutableListOf<InstalledApp>()
        val selfPackage = appContext.packageName

        for (pkgInfo in packages) {
            val appInfo = pkgInfo.applicationInfo ?: continue

            // Don't list TwinSpace itself
            if (pkgInfo.packageName == selfPackage) continue

            val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            if (isSystem && !includeSystem) continue

            // Must have a launchable intent to be clonable
            val launchIntent = pm.getLaunchIntentForPackage(pkgInfo.packageName)
            if (launchIntent == null && !includeSystem) continue

            val appName = try {
                pm.getApplicationLabel(appInfo).toString()
            } catch (e: Exception) {
                pkgInfo.packageName
            }

            val iconUri = getOrCreateAppIconUri(pkgInfo.packageName, appInfo)

            val apkSize = try {
                File(appInfo.sourceDir).length()
            } catch (e: Exception) {
                0L
            }

            val versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                pkgInfo.longVersionCode
            } else {
                @Suppress("DEPRECATION")
                pkgInfo.versionCode.toLong()
            }

            val cloneCount = clonedApps.values.count { it.packageName == pkgInfo.packageName }

            result.add(
                InstalledApp(
                    packageName = pkgInfo.packageName,
                    appName = appName,
                    versionName = pkgInfo.versionName ?: "1.0",
                    versionCode = versionCode,
                    isSystem = isSystem,
                    iconUri = iconUri,
                    apkSize = apkSize,
                    cloneCount = cloneCount
                )
            )
        }

        // Sort alphabetically by app name
        result.sortBy { it.appName.lowercase() }
        return result
    }

    /**
     * Returns the list of all currently registered clones.
     */
    fun getClonedApps(): List<ClonedApp> {
        return clonedApps.values.sortedByDescending { it.lastLaunchedAt }
    }

    @Suppress("DEPRECATION")
    private fun getAppInfoCompat(pm: PackageManager, packageName: String): ApplicationInfo {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            pm.getApplicationInfo(packageName, PackageManager.ApplicationInfoFlags.of(0L))
        } else {
            pm.getApplicationInfo(packageName, 0)
        }
    }

    /**
     * Clones an installed application into an isolated virtual space.
     */
    fun cloneApp(packageName: String, alias: String?): ClonedApp? {
        val pm = appContext.packageManager
        val appInfo = try {
            getAppInfoCompat(pm, packageName)
        } catch (e: Exception) {
            Log.e(TAG, "Package $packageName not found on device", e)
            return null
        }

        val appName = pm.getApplicationLabel(appInfo).toString()

        // Determine the next userId for this package (0 for first clone, 1 for second, etc.)
        val existingClones = clonedApps.values.filter { it.packageName == packageName }
        val usedUserIds = existingClones.map { it.userId }.toSet()
        var nextUserId = 0
        while (usedUserIds.contains(nextUserId)) {
            nextUserId++
        }

        val cloneId = "${packageName}_$nextUserId"
        val cloneAlias = alias?.trim()?.takeIf { it.isNotEmpty() }
            ?: if (nextUserId == 0) "$appName (Space 1)" else "$appName (Space ${nextUserId + 1})"

        // Initialize virtual sandbox directory tree
        val sandboxOk = sandboxManager.initVirtualSandbox(packageName, nextUserId)
        if (!sandboxOk) {
            Log.e(TAG, "Failed to initialize sandbox directories for $cloneId")
            return null
        }

        val iconUri = getOrCreateAppIconUri(packageName, appInfo)

        val clonedApp = ClonedApp(
            id = cloneId,
            packageName = packageName,
            appName = appName,
            userId = nextUserId,
            alias = cloneAlias,
            iconUri = iconUri,
            sourceDir = appInfo.sourceDir,
            createdAt = System.currentTimeMillis(),
            lastLaunchedAt = 0L
        )

        clonedApps[cloneId] = clonedApp
        saveClonesRegistry()
        Log.i(TAG, "Cloned $packageName successfully as $cloneId (User $nextUserId)")
        return clonedApp
    }

    /**
     * Launches a cloned application inside the virtual container.
     */
    fun launchClone(cloneId: String): Boolean {
        val clone = clonedApps[cloneId] ?: return false
        val pm = appContext.packageManager

        val launchIntent = pm.getLaunchIntentForPackage(clone.packageName)
        if (launchIntent == null) {
            Log.e(TAG, "Launch intent not found for ${clone.packageName}")
            return false
        }

        val targetComponent = launchIntent.component
        val targetActivityName = targetComponent?.className ?: ""

        val containerIntent = Intent(appContext, TwinContainerActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(TwinContainerActivity.EXTRA_TARGET_PACKAGE, clone.packageName)
            putExtra(TwinContainerActivity.EXTRA_TARGET_ACTIVITY, targetActivityName)
            putExtra(TwinContainerActivity.EXTRA_USER_ID, clone.userId)
            putExtra(TwinContainerActivity.EXTRA_CLONE_ID, clone.id)
            putExtra(TwinContainerActivity.EXTRA_APP_LABEL, clone.alias)
        }

        appContext.startActivity(containerIntent)

        // Update last launched timestamp
        clone.lastLaunchedAt = System.currentTimeMillis()
        saveClonesRegistry()
        return true
    }

    /**
     * Removes a cloned instance and purges its isolated storage.
     */
    fun removeClone(cloneId: String): Boolean {
        val clone = clonedApps.remove(cloneId) ?: return false

        // Purge sandbox data
        sandboxManager.deleteVirtualSandbox(clone.packageName, clone.userId)

        // If no more clones of this package, evict classloader and resources
        val remaining = clonedApps.values.any { it.packageName == clone.packageName }
        if (!remaining) {
            classLoaderManager.evict(clone.packageName)
            resourceManager.evict(clone.packageName)
        }

        saveClonesRegistry()
        Log.i(TAG, "Removed clone $cloneId")
        return true
    }

    /**
     * Pins a shortcut to the Android home screen for direct one-tap launch.
     */
    fun createHomeScreenShortcut(cloneId: String): Boolean {
        val clone = clonedApps[cloneId] ?: return false
        val pm = appContext.packageManager

        val iconDrawable = try {
            val appInfo = getAppInfoCompat(pm, clone.packageName)
            pm.getApplicationIcon(appInfo)
        } catch (e: Exception) {
            null
        }

        return shortcutManager.pinShortcut(
            cloneId = clone.id,
            packageName = clone.packageName,
            userId = clone.userId,
            label = clone.alias,
            originalIcon = iconDrawable
        )
    }

    /**
     * Creates a customized virtual context for a given package and user ID.
     */
    fun createVirtualContext(baseContext: Context, packageName: String, userId: Int): TwinVirtualContext {
        val pm = appContext.packageManager
        val appInfo = try {
            getAppInfoCompat(pm, packageName)
        } catch (e: Exception) {
            null
        }

        val optDir = sandboxManager.getVirtualCodeCacheDir(packageName, userId)
        val classLoader = if (appInfo != null) {
            classLoaderManager.getOrCreateClassLoader(
                packageName,
                appInfo.sourceDir,
                appInfo.nativeLibraryDir,
                optDir
            )
        } else null

        val resPair = if (appInfo != null) {
            resourceManager.getOrCreateResources(packageName, appInfo)
        } else null

        return TwinVirtualContext(
            base = baseContext,
            virtualPackageName = packageName,
            virtualUserId = userId,
            sandboxManager = sandboxManager,
            guestClassLoader = classLoader,
            guestResources = resPair?.first,
            guestAssets = resPair?.second,
            guestAppInfo = appInfo
        )
    }

    fun loadGuestClass(packageName: String, className: String): Class<*>? {
        return classLoaderManager.loadClass(packageName, className)
    }

    private fun getOrCreateAppIconUri(packageName: String, appInfo: ApplicationInfo): String {
        iconCache[packageName]?.let { return it }

        val pm = appContext.packageManager
        val iconDrawable = try {
            pm.getApplicationIcon(appInfo)
        } catch (e: Exception) {
            return ""
        }

        // Save icon to local disk cache for fast React Native Image loading
        val iconsDir = File(appContext.filesDir, ICONS_DIR)
        if (!iconsDir.exists()) iconsDir.mkdirs()

        val iconFile = File(iconsDir, "${packageName}.png")
        if (iconFile.exists() && iconFile.length() > 0) {
            val uri = "file://${iconFile.absolutePath}"
            iconCache[packageName] = uri
            return uri
        }

        return try {
            val bitmap = drawableToBitmap(iconDrawable)
            FileOutputStream(iconFile).use { out ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            }
            val uri = "file://${iconFile.absolutePath}"
            iconCache[packageName] = uri
            uri
        } catch (e: Exception) {
            Log.w(TAG, "Failed to write icon file for $packageName, using Base64", e)
            val base64 = drawableToBase64(iconDrawable)
            iconCache[packageName] = base64
            base64
        }
    }

    private fun drawableToBitmap(drawable: Drawable): Bitmap {
        if (drawable is BitmapDrawable && drawable.bitmap != null) {
            return drawable.bitmap
        }
        val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 144
        val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 144
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bitmap
    }

    private fun drawableToBase64(drawable: Drawable): String {
        val bitmap = drawableToBitmap(drawable)
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
        val byteArray = stream.toByteArray()
        return "data:image/png;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP)
    }

    private fun saveClonesRegistry() {
        try {
            val file = File(appContext.filesDir, REGISTRY_FILE)
            val array = JSONArray()
            for (clone in clonedApps.values) {
                array.put(clone.toJson())
            }
            file.writeText(array.toString(2))
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save clones registry", e)
        }
    }

    private fun loadClonesRegistry() {
        try {
            val file = File(appContext.filesDir, REGISTRY_FILE)
            if (!file.exists()) return
            val content = file.readText()
            val array = JSONArray(content)
            clonedApps.clear()
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                val clone = ClonedApp.fromJson(obj)
                clonedApps[clone.id] = clone
            }
            Log.i(TAG, "Loaded ${clonedApps.size} clones from registry.")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load clones registry", e)
        }
    }
}
