package com.twinspace.virtual.core

import android.content.Context
import android.util.Log
import java.io.File

/**
 * TwinSandboxManager:
 * Manages the isolated file system sandbox for every virtual user and cloned package.
 * Ensures strict physical data isolation:
 * - Original app at /data/data/<pkg> is NEVER touched.
 * - Each clone instance (userId: 0, 1, ...) has an isolated directory tree:
 *   /data/data/com.twinspace.app/files/twinspace/virtual/users/<userId>/<packageName>/
 *   ├── data/
 *   │   ├── files/
 *   │   ├── cache/
 *   │   ├── databases/
 *   │   ├── shared_prefs/
 *   │   ├── code_cache/
 *   │   └── no_backup/
 *   └── sdcard/
 */
class TwinSandboxManager(private val hostContext: Context) {

    companion object {
        private const val TAG = "TwinSandboxManager"
        private const val VIRTUAL_ROOT_DIR = "twinspace/virtual/users"
    }

    data class StorageUsage(
        val totalBytes: Long,
        val appDataBytes: Long,
        val cacheBytes: Long,
        val databaseBytes: Long,
        val sharedPrefsBytes: Long
    )

    /**
     * Returns the root sandbox directory for a given user and package.
     */
    fun getVirtualUserPackageDir(packageName: String, userId: Int): File {
        val root = File(hostContext.filesDir, "$VIRTUAL_ROOT_DIR/$userId/$packageName")
        if (!root.exists()) {
            root.mkdirs()
        }
        return root
    }

    /**
     * Returns the virtual data directory (corresponds to /data/data/<pkg>).
     */
    fun getVirtualDataDir(packageName: String, userId: Int): File {
        val dataDir = File(getVirtualUserPackageDir(packageName, userId), "data")
        if (!dataDir.exists()) {
            dataDir.mkdirs()
        }
        return dataDir
    }

    fun getVirtualFilesDir(packageName: String, userId: Int): File {
        val dir = File(getVirtualDataDir(packageName, userId), "files")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    fun getVirtualCacheDir(packageName: String, userId: Int): File {
        val dir = File(getVirtualDataDir(packageName, userId), "cache")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    fun getVirtualCodeCacheDir(packageName: String, userId: Int): File {
        val dir = File(getVirtualDataDir(packageName, userId), "code_cache")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    fun getVirtualNoBackupDir(packageName: String, userId: Int): File {
        val dir = File(getVirtualDataDir(packageName, userId), "no_backup")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    fun getVirtualDatabaseDir(packageName: String, userId: Int): File {
        val dir = File(getVirtualDataDir(packageName, userId), "databases")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    fun getVirtualDatabasePath(packageName: String, userId: Int, name: String): File {
        val dbDir = getVirtualDatabaseDir(packageName, userId)
        return File(dbDir, name)
    }

    fun getVirtualSharedPrefsDir(packageName: String, userId: Int): File {
        val dir = File(getVirtualDataDir(packageName, userId), "shared_prefs")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    fun getVirtualExternalDir(packageName: String, userId: Int, type: String?): File {
        val extRoot = hostContext.getExternalFilesDir(null) ?: hostContext.filesDir
        val path = if (type.isNullOrEmpty()) {
            "twinspace/virtual/users/$userId/$packageName/files"
        } else {
            "twinspace/virtual/users/$userId/$packageName/files/$type"
        }
        val dir = File(extRoot, path)
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    fun getVirtualExternalCacheDir(packageName: String, userId: Int): File {
        val extCacheRoot = hostContext.externalCacheDir ?: hostContext.cacheDir
        val dir = File(extCacheRoot, "twinspace/virtual/users/$userId/$packageName/cache")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    /**
     * Initializes the sandbox directories for a newly cloned application.
     */
    fun initVirtualSandbox(packageName: String, userId: Int): Boolean {
        return try {
            getVirtualDataDir(packageName, userId)
            getVirtualFilesDir(packageName, userId)
            getVirtualCacheDir(packageName, userId)
            getVirtualCodeCacheDir(packageName, userId)
            getVirtualNoBackupDir(packageName, userId)
            getVirtualDatabaseDir(packageName, userId)
            getVirtualSharedPrefsDir(packageName, userId)
            Log.i(TAG, "Virtual sandbox initialized for $packageName (User $userId)")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize sandbox for $packageName (User $userId)", e)
            false
        }
    }

    /**
     * Calculates storage breakdown in bytes for a cloned app instance.
     */
    fun getStorageUsage(packageName: String, userId: Int): StorageUsage {
        val dataDir = getVirtualDataDir(packageName, userId)
        val filesDir = getVirtualFilesDir(packageName, userId)
        val cacheDir = getVirtualCacheDir(packageName, userId)
        val dbDir = getVirtualDatabaseDir(packageName, userId)
        val spDir = getVirtualSharedPrefsDir(packageName, userId)

        val filesBytes = getDirectorySize(filesDir)
        val cacheBytes = getDirectorySize(cacheDir)
        val dbBytes = getDirectorySize(dbDir)
        val spBytes = getDirectorySize(spDir)
        val totalBytes = getDirectorySize(dataDir)

        return StorageUsage(
            totalBytes = totalBytes,
            appDataBytes = filesBytes,
            cacheBytes = cacheBytes,
            databaseBytes = dbBytes,
            sharedPrefsBytes = spBytes
        )
    }

    /**
     * Clears only cache files (internal and external cache) for the cloned app.
     */
    fun clearCache(packageName: String, userId: Int): Boolean {
        return try {
            deleteDirectoryContents(getVirtualCacheDir(packageName, userId))
            deleteDirectoryContents(getVirtualExternalCacheDir(packageName, userId))
            Log.i(TAG, "Cache cleared for $packageName (User $userId)")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to clear cache for $packageName (User $userId)", e)
            false
        }
    }

    /**
     * Clears all cloned data (resets clone to fresh state).
     */
    fun clearAllData(packageName: String, userId: Int): Boolean {
        return try {
            val dataDir = getVirtualDataDir(packageName, userId)
            deleteDirectoryContents(dataDir)
            initVirtualSandbox(packageName, userId)
            Log.i(TAG, "All data reset for $packageName (User $userId)")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to reset data for $packageName (User $userId)", e)
            false
        }
    }

    /**
     * Completely removes the virtual sandbox from disk when deleting a clone.
     */
    fun deleteVirtualSandbox(packageName: String, userId: Int): Boolean {
        return try {
            val userPkgDir = getVirtualUserPackageDir(packageName, userId)
            val deleted = deleteDirectory(userPkgDir)
            val extDir = getVirtualExternalDir(packageName, userId, null)
            deleteDirectory(extDir)
            Log.i(TAG, "Virtual sandbox deleted for $packageName (User $userId)")
            deleted
        } catch (e: Exception) {
            Log.e(TAG, "Failed to delete sandbox for $packageName (User $userId)", e)
            false
        }
    }

    private fun getDirectorySize(dir: File): Long {
        if (!dir.exists()) return 0L
        if (dir.isFile) return dir.length()
        var size = 0L
        val files = dir.listFiles() ?: return 0L
        for (f in files) {
            size += if (f.isDirectory) getDirectorySize(f) else f.length()
        }
        return size
    }

    private fun deleteDirectoryContents(dir: File): Boolean {
        if (!dir.exists() || !dir.isDirectory) return true
        val children = dir.listFiles() ?: return true
        var success = true
        for (child in children) {
            val ok = if (child.isDirectory) deleteDirectory(child) else child.delete()
            if (!ok) success = false
        }
        return success
    }

    private fun deleteDirectory(dir: File): Boolean {
        if (!dir.exists()) return true
        if (dir.isDirectory) {
            val children = dir.listFiles()
            if (children != null) {
                for (child in children) {
                    deleteDirectory(child)
                }
            }
        }
        return dir.delete()
    }
}
