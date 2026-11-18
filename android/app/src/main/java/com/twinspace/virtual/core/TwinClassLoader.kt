package com.twinspace.virtual.core

import android.content.Context
import android.util.Log
import dalvik.system.DexClassLoader
import dalvik.system.PathClassLoader
import java.io.File
import java.util.concurrent.ConcurrentHashMap

/**
 * TwinClassLoader:
 * Loads the DEX code and native libraries (.so) of installed Android applications
 * directly from their installed APK source directory (/data/app/...).
 * 
 * It manages ClassLoader isolation so that each cloned application's classes
 * are resolved correctly without conflicting with TwinSpace's own classes.
 */
class TwinClassLoader(private val hostContext: Context) {

    companion object {
        private const val TAG = "TwinClassLoader"
    }

    private val classLoaderCache = ConcurrentHashMap<String, ClassLoader>()

    /**
     * Obtains or creates a ClassLoader for the specified package.
     */
    fun getOrCreateClassLoader(
        packageName: String,
        sourceDir: String,
        nativeLibraryDir: String?,
        optDir: File
    ): ClassLoader {
        return classLoaderCache.getOrPut(packageName) {
            createDexClassLoader(sourceDir, nativeLibraryDir, optDir)
        }
    }

    /**
     * Creates a ClassLoader configured with the guest APK's dex and native libs.
     */
    private fun createDexClassLoader(
        sourceDir: String,
        nativeLibraryDir: String?,
        optDir: File
    ): ClassLoader {
        Log.d(TAG, "Creating ClassLoader for source: $sourceDir, nativeLibs: $nativeLibraryDir")

        if (!optDir.exists()) {
            optDir.mkdirs()
        }

        return try {
            // Check if PathClassLoader can directly access the APK (standard on Android 8+)
            val parent = hostContext.classLoader
            val nativePath = nativeLibraryDir ?: hostContext.applicationInfo.nativeLibraryDir

            // Use DexClassLoader pointing to the APK source and optimized dex directory
            @Suppress("DEPRECATION")
            DexClassLoader(
                sourceDir,
                optDir.absolutePath,
                nativePath,
                parent
            )
        } catch (e: Throwable) {
            Log.w(TAG, "DexClassLoader creation failed, falling back to PathClassLoader: ${e.message}")
            PathClassLoader(
                sourceDir,
                nativeLibraryDir ?: hostContext.applicationInfo.nativeLibraryDir,
                hostContext.classLoader
            )
        }
    }

    /**
     * Loads a class by name from the guest application's ClassLoader.
     */
    fun loadClass(packageName: String, className: String): Class<*>? {
        val cl = classLoaderCache[packageName]
        if (cl == null) {
            Log.e(TAG, "No ClassLoader registered for package $packageName")
            return null
        }
        return try {
            cl.loadClass(className)
        } catch (e: ClassNotFoundException) {
            Log.e(TAG, "Class not found: $className in $packageName", e)
            null
        }
    }

    /**
     * Evicts the cached class loader when a clone is deleted or updated.
     */
    fun evict(packageName: String) {
        classLoaderCache.remove(packageName)
    }
}
