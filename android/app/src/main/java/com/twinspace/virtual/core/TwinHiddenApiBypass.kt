package com.twinspace.virtual.core

import android.os.Build
import android.util.Log
import java.lang.reflect.Method

/**
 * TwinHiddenApiBypass:
 * Bypasses Android's Hidden API Enforcement (introduced in Android 9 / Pie up to Android 15).
 * Uses double-reflection (meta-reflection) to call VMRuntime.setHiddenApiExemptions
 * so that private Android framework APIs (like ActivityThread, Instrumentation, LoadedApk)
 * can be accessed safely without triggering NoSuchMethodException / NoSuchFieldException.
 */
object TwinHiddenApiBypass {
    private const val TAG = "TwinHiddenApiBypass"
    private var isExempted = false

    fun unseal(): Boolean {
        if (isExempted) return true
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            isExempted = true
            return true
        }

        return try {
            // Step 1: Use Class.forName with meta-reflection
            val forNameMethod = Class::class.java.getDeclaredMethod(
                "forName",
                String::class.java
            )
            val getDeclaredMethod = Class::class.java.getDeclaredMethod(
                "getDeclaredMethod",
                String::class.java,
                arrayOf<Class<*>>()::class.java
            )

            // Step 2: Acquire dalvik.system.VMRuntime
            val vmRuntimeClass = forNameMethod.invoke(null, "dalvik.system.VMRuntime") as Class<*>
            val getRuntimeMethod = getDeclaredMethod.invoke(
                vmRuntimeClass,
                "getRuntime",
                null
            ) as Method
            val vmRuntimeInstance = getRuntimeMethod.invoke(null)

            // Step 3: Call setHiddenApiExemptions("L") to exempt all hidden APIs
            val setHiddenApiExemptionsMethod = getDeclaredMethod.invoke(
                vmRuntimeClass,
                "setHiddenApiExemptions",
                arrayOf<Class<*>>(arrayOf<String>()::class.java)
            ) as Method

            setHiddenApiExemptionsMethod.invoke(
                vmRuntimeInstance,
                arrayOf("L")
            )

            isExempted = true
            Log.d(TAG, "Hidden API restrictions successfully bypassed.")
            true
        } catch (e: Throwable) {
            Log.w(TAG, "Failed to bypass Hidden API via meta-reflection: ${e.message}")
            false
        }
    }
}
