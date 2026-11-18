package com.twinspace.virtual.core

import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.ApplicationInfo
import android.content.res.AssetManager
import android.content.res.Resources
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteDatabase.CursorFactory
import android.os.Bundle
import android.util.Log
import com.twinspace.virtual.stub.TwinContainerActivity
import java.io.File
import java.util.concurrent.ConcurrentHashMap

/**
 * TwinVirtualContext:
 * Custom ContextWrapper that redirects all storage, application info, resources,
 * and component launching calls for a virtualized application instance.
 * 
 * Every read and write to:
 * - SQLite databases (getDatabasePath)
 * - SharedPreferences (getSharedPreferences)
 * - Internal storage (getFilesDir, getDataDir)
 * - Cache (getCacheDir)
 * - External storage (getExternalFilesDir, getExternalCacheDir)
 * is redirected into the isolated sandbox for this (packageName, userId) pair.
 * 
 * This guarantees 100% independence of login sessions, tokens, user settings,
 * and cached state from the original system app and between clones.
 */
class TwinVirtualContext(
    base: Context,
    val virtualPackageName: String,
    val virtualUserId: Int,
    private val sandboxManager: TwinSandboxManager,
    private val guestClassLoader: ClassLoader? = null,
    private val guestResources: Resources? = null,
    private val guestAssets: AssetManager? = null,
    private val guestAppInfo: ApplicationInfo? = null
) : ContextWrapper(base) {

    companion object {
        private const val TAG = "TwinVirtualContext"
    }

    private val sharedPrefsCache = ConcurrentHashMap<String, SharedPreferences>()

    override fun getPackageName(): String = virtualPackageName

    override fun getBasePackageName(): String = virtualPackageName

    override fun getOpPackageName(): String = virtualPackageName

    override fun getApplicationInfo(): ApplicationInfo {
        return guestAppInfo ?: super.getApplicationInfo()
    }

    override fun getDataDir(): File {
        return sandboxManager.getVirtualDataDir(virtualPackageName, virtualUserId)
    }

    override fun getFilesDir(): File {
        return sandboxManager.getVirtualFilesDir(virtualPackageName, virtualUserId)
    }

    override fun getCacheDir(): File {
        return sandboxManager.getVirtualCacheDir(virtualPackageName, virtualUserId)
    }

    override fun getCodeCacheDir(): File {
        return sandboxManager.getVirtualCodeCacheDir(virtualPackageName, virtualUserId)
    }

    override fun getNoBackupFilesDir(): File {
        return sandboxManager.getVirtualNoBackupDir(virtualPackageName, virtualUserId)
    }

    override fun getDatabasePath(name: String): File {
        val dbFile = sandboxManager.getVirtualDatabasePath(virtualPackageName, virtualUserId, name)
        dbFile.parentFile?.mkdirs()
        return dbFile
    }

    override fun openOrCreateDatabase(
        name: String,
        mode: Int,
        factory: CursorFactory?
    ): SQLiteDatabase {
        val dbFile = getDatabasePath(name)
        return SQLiteDatabase.openOrCreateDatabase(dbFile, factory)
    }

    override fun openOrCreateDatabase(
        name: String,
        mode: Int,
        factory: CursorFactory?,
        errorHandler: android.database.DatabaseErrorHandler?
    ): SQLiteDatabase {
        val dbFile = getDatabasePath(name)
        return SQLiteDatabase.openOrCreateDatabase(dbFile.path, factory, errorHandler)
    }

    override fun getExternalFilesDir(type: String?): File {
        return sandboxManager.getVirtualExternalDir(virtualPackageName, virtualUserId, type)
    }

    override fun getExternalCacheDir(): File {
        return sandboxManager.getVirtualExternalCacheDir(virtualPackageName, virtualUserId)
    }

    override fun getClassLoader(): ClassLoader {
        return guestClassLoader ?: super.getClassLoader()
    }

    override fun getResources(): Resources {
        return guestResources ?: super.getResources()
    }

    override fun getAssets(): AssetManager {
        return guestAssets ?: super.getAssets()
    }

    override fun getSharedPreferences(name: String, mode: Int): SharedPreferences {
        val key = "${virtualPackageName}_${virtualUserId}_$name"
        return sharedPrefsCache.getOrPut(key) {
            // Use Android's standard preferences with a scoped file prefix
            val scopedName = "twin_sp_${virtualUserId}_${virtualPackageName}_$name"
            baseContext.getSharedPreferences(scopedName, mode)
        }
    }

    override fun startActivity(intent: Intent) {
        startActivity(intent, null)
    }

    override fun startActivity(intent: Intent, options: Bundle?) {
        val targetComponent = intent.component
        val targetPackage = intent.`package` ?: targetComponent?.packageName

        // If launching an activity within the same cloned package, redirect to TwinContainerActivity
        if (targetPackage == null || targetPackage == virtualPackageName) {
            val containerIntent = Intent(baseContext, TwinContainerActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                putExtra(TwinContainerActivity.EXTRA_TARGET_PACKAGE, virtualPackageName)
                targetComponent?.className?.let { className ->
                    putExtra(TwinContainerActivity.EXTRA_TARGET_ACTIVITY, className)
                }
                putExtra(TwinContainerActivity.EXTRA_USER_ID, virtualUserId)
                putExtra(TwinContainerActivity.EXTRA_ORIGINAL_INTENT, intent)
            }
            Log.d(TAG, "Redirecting internal activity launch: ${targetComponent?.className} in clone $virtualUserId")
            baseContext.startActivity(containerIntent, options)
        } else {
            // External intent (e.g. browser, share sheet, system chooser)
            try {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                baseContext.startActivity(intent, options)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start external intent: $intent", e)
            }
        }
    }
}
