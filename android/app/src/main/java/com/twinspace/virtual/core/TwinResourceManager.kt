package com.twinspace.virtual.core

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.res.AssetManager
import android.content.res.Resources
import android.util.Log
import java.util.concurrent.ConcurrentHashMap

/**
 * TwinResourceManager:
 * Loads, constructs, and manages Android Resources and AssetManager for guest applications.
 * 
 * Cloned applications (like ChatGPT) contain their own UI XML layouts, drawables, strings,
 * and theme definitions. This manager ensures that when the guest activity runs inside
 * TwinSpace, its resource IDs are properly resolved from the installed APK.
 */
class TwinResourceManager(private val hostContext: Context) {

    companion object {
        private const val TAG = "TwinResourceManager"
    }

    private val resourcesCache = ConcurrentHashMap<String, Resources>()
    private val assetsCache = ConcurrentHashMap<String, AssetManager>()

    /**
     * Creates or retrieves a Resources instance configured with the guest APK's assets.
     */
    fun getOrCreateResources(
        packageName: String,
        appInfo: ApplicationInfo
    ): Pair<Resources, AssetManager>? {
        val cachedRes = resourcesCache[packageName]
        val cachedAssets = assetsCache[packageName]
        if (cachedRes != null && cachedAssets != null) {
            return Pair(cachedRes, cachedAssets)
        }

        // Strategy 1: Attempt to create Package Context via Android Framework
        try {
            val guestContext = hostContext.createPackageContext(
                packageName,
                Context.CONTEXT_INCLUDE_CODE or Context.CONTEXT_IGNORE_SECURITY
            )
            val res = guestContext.resources
            val assets = guestContext.assets
            if (res != null && assets != null) {
                resourcesCache[packageName] = res
                assetsCache[packageName] = assets
                Log.d(TAG, "Acquired Resources for $packageName via createPackageContext")
                return Pair(res, assets)
            }
        } catch (e: Throwable) {
            Log.w(TAG, "createPackageContext failed for $packageName, falling back to AssetManager reflection: ${e.message}")
        }

        // Strategy 2: Dynamic AssetManager construction via reflection
        try {
            TwinHiddenApiBypass.unseal()
            val assetManagerClass = AssetManager::class.java
            val assetManagerInstance = assetManagerClass.getDeclaredConstructor().newInstance()
            val addAssetPathMethod = assetManagerClass.getDeclaredMethod(
                "addAssetPath",
                String::class.java
            )
            addAssetPathMethod.isAccessible = true

            // Add base APK
            addAssetPathMethod.invoke(assetManagerInstance, appInfo.sourceDir)

            // Add any split APKs (common on modern Android app bundles)
            appInfo.splitSourceDirs?.forEach { splitDir ->
                addAssetPathMethod.invoke(assetManagerInstance, splitDir)
            }

            // Create Resources instance
            val hostRes = hostContext.resources
            @Suppress("DEPRECATION")
            val guestRes = Resources(
                assetManagerInstance,
                hostRes.displayMetrics,
                hostRes.configuration
            )

            resourcesCache[packageName] = guestRes
            assetsCache[packageName] = assetManagerInstance
            Log.d(TAG, "Successfully constructed Resources for $packageName via AssetManager.addAssetPath")
            return Pair(guestRes, assetManagerInstance)
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to construct Resources for $packageName", e)
            return null
        }
    }

    fun evict(packageName: String) {
        resourcesCache.remove(packageName)
        assetsCache.remove(packageName)
    }
}
