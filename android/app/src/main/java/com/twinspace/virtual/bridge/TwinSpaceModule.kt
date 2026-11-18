package com.twinspace.virtual.bridge

import android.os.Build
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.twinspace.virtual.core.TwinHiddenApiBypass
import com.twinspace.virtual.core.TwinVirtualEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * TwinSpaceModule:
 * React Native bridge exposing the full Android native virtualization engine,
 * application discovery, sandbox storage, and home-screen shortcut management
 * to the TypeScript frontend.
 */
class TwinSpaceModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "TwinSpaceModule"
        private const val TAG = "TwinSpaceModule"
    }

    private val moduleScope = CoroutineScope(Dispatchers.Default)

    override fun getName(): String = NAME

    private fun getEngine(): TwinVirtualEngine {
        return TwinVirtualEngine.getInstance(reactApplicationContext)
            ?: throw IllegalStateException("TwinVirtualEngine could not be initialized")
    }

    @ReactMethod
    fun getInstalledApps(includeSystem: Boolean, promise: Promise) {
        moduleScope.launch {
            try {
                val engine = getEngine()
                val apps = engine.getInstalledApps(includeSystem)
                val array: WritableArray = Arguments.createArray()

                for (app in apps) {
                    val map: WritableMap = Arguments.createMap().apply {
                        putString("packageName", app.packageName)
                        putString("appName", app.appName)
                        putString("versionName", app.versionName)
                        putDouble("versionCode", app.versionCode.toDouble())
                        putBoolean("isSystem", app.isSystem)
                        putString("iconUri", app.iconUri)
                        putDouble("apkSize", app.apkSize.toDouble())
                        putInt("cloneCount", app.cloneCount)
                    }
                    array.pushMap(map)
                }

                withContext(Dispatchers.Main) {
                    promise.resolve(array)
                }
            } catch (e: Throwable) {
                Log.e(TAG, "Error fetching installed apps", e)
                withContext(Dispatchers.Main) {
                    promise.reject("GET_INSTALLED_APPS_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun getClonedApps(promise: Promise) {
        moduleScope.launch {
            try {
                val engine = getEngine()
                val clones = engine.getClonedApps()
                val array: WritableArray = Arguments.createArray()

                for (clone in clones) {
                    val map: WritableMap = Arguments.createMap().apply {
                        putString("id", clone.id)
                        putString("packageName", clone.packageName)
                        putString("appName", clone.appName)
                        putInt("userId", clone.userId)
                        putString("alias", clone.alias)
                        putString("iconUri", clone.iconUri)
                        putString("sourceDir", clone.sourceDir)
                        putDouble("createdAt", clone.createdAt.toDouble())
                        putDouble("lastLaunchedAt", clone.lastLaunchedAt.toDouble())
                    }
                    array.pushMap(map)
                }

                withContext(Dispatchers.Main) {
                    promise.resolve(array)
                }
            } catch (e: Throwable) {
                Log.e(TAG, "Error fetching cloned apps", e)
                withContext(Dispatchers.Main) {
                    promise.reject("GET_CLONED_APPS_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun cloneApp(packageName: String, alias: String?, promise: Promise) {
        moduleScope.launch {
            try {
                val engine = getEngine()
                val clone = engine.cloneApp(packageName, alias)

                if (clone != null) {
                    val map: WritableMap = Arguments.createMap().apply {
                        putString("id", clone.id)
                        putString("packageName", clone.packageName)
                        putString("appName", clone.appName)
                        putInt("userId", clone.userId)
                        putString("alias", clone.alias)
                        putString("iconUri", clone.iconUri)
                        putString("sourceDir", clone.sourceDir)
                        putDouble("createdAt", clone.createdAt.toDouble())
                        putDouble("lastLaunchedAt", clone.lastLaunchedAt.toDouble())
                    }
                    withContext(Dispatchers.Main) {
                        promise.resolve(map)
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        promise.reject("CLONE_ERROR", "Failed to create virtual clone for $packageName")
                    }
                }
            } catch (e: Throwable) {
                Log.e(TAG, "Error cloning app: $packageName", e)
                withContext(Dispatchers.Main) {
                    promise.reject("CLONE_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun launchClone(cloneId: String, promise: Promise) {
        try {
            val engine = getEngine()
            val launched = engine.launchClone(cloneId)
            promise.resolve(launched)
        } catch (e: Throwable) {
            Log.e(TAG, "Error launching clone: $cloneId", e)
            promise.reject("LAUNCH_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun removeClone(cloneId: String, promise: Promise) {
        moduleScope.launch {
            try {
                val engine = getEngine()
                val removed = engine.removeClone(cloneId)
                withContext(Dispatchers.Main) {
                    promise.resolve(removed)
                }
            } catch (e: Throwable) {
                Log.e(TAG, "Error removing clone: $cloneId", e)
                withContext(Dispatchers.Main) {
                    promise.reject("REMOVE_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun createHomeScreenShortcut(cloneId: String, promise: Promise) {
        try {
            val engine = getEngine()
            val pinned = engine.createHomeScreenShortcut(cloneId)
            promise.resolve(pinned)
        } catch (e: Throwable) {
            Log.e(TAG, "Error creating shortcut for: $cloneId", e)
            promise.reject("SHORTCUT_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getCloneStorageInfo(cloneId: String, promise: Promise) {
        moduleScope.launch {
            try {
                val engine = getEngine()
                val clone = engine.getClonedApps().find { it.id == cloneId }

                if (clone == null) {
                    withContext(Dispatchers.Main) {
                        promise.reject("NOT_FOUND", "Clone $cloneId not found")
                    }
                    return@launch
                }

                val usage = engine.sandboxManager.getStorageUsage(clone.packageName, clone.userId)
                val map: WritableMap = Arguments.createMap().apply {
                    putDouble("totalBytes", usage.totalBytes.toDouble())
                    putDouble("appDataBytes", usage.appDataBytes.toDouble())
                    putDouble("cacheBytes", usage.cacheBytes.toDouble())
                    putDouble("databaseBytes", usage.databaseBytes.toDouble())
                    putDouble("sharedPrefsBytes", usage.sharedPrefsBytes.toDouble())
                }

                withContext(Dispatchers.Main) {
                    promise.resolve(map)
                }
            } catch (e: Throwable) {
                Log.e(TAG, "Error fetching storage info for $cloneId", e)
                withContext(Dispatchers.Main) {
                    promise.reject("STORAGE_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun clearCloneCache(cloneId: String, promise: Promise) {
        moduleScope.launch {
            try {
                val engine = getEngine()
                val clone = engine.getClonedApps().find { it.id == cloneId }
                if (clone != null) {
                    val cleared = engine.sandboxManager.clearCache(clone.packageName, clone.userId)
                    withContext(Dispatchers.Main) {
                        promise.resolve(cleared)
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        promise.reject("NOT_FOUND", "Clone $cloneId not found")
                    }
                }
            } catch (e: Throwable) {
                withContext(Dispatchers.Main) {
                    promise.reject("CLEAR_CACHE_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun clearCloneData(cloneId: String, promise: Promise) {
        moduleScope.launch {
            try {
                val engine = getEngine()
                val clone = engine.getClonedApps().find { it.id == cloneId }
                if (clone != null) {
                    val cleared = engine.sandboxManager.clearAllData(clone.packageName, clone.userId)
                    withContext(Dispatchers.Main) {
                        promise.resolve(cleared)
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        promise.reject("NOT_FOUND", "Clone $cloneId not found")
                    }
                }
            } catch (e: Throwable) {
                withContext(Dispatchers.Main) {
                    promise.reject("CLEAR_DATA_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun getSystemVirtualizationInfo(promise: Promise) {
        try {
            val engine = getEngine()
            val totalClones = engine.getClonedApps().size
            val map: WritableMap = Arguments.createMap().apply {
                putInt("androidSdk", Build.VERSION.SDK_INT)
                putString("deviceModel", "${Build.MANUFACTURER} ${Build.MODEL}")
                putString("androidRelease", Build.VERSION.RELEASE)
                putBoolean("hiddenApiBypassed", true)
                putBoolean("isRootRequired", false)
                putInt("totalClonesCount", totalClones)
                putString("sandboxDirectory", reactApplicationContext.filesDir.path + "/twinspace/virtual")
            }
            promise.resolve(map)
        } catch (e: Throwable) {
            promise.reject("SYS_INFO_ERROR", e.message, e)
        }
    }
}
