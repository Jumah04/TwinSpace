package com.twinspace.virtual.core

import android.app.Activity
import android.app.Instrumentation
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.IBinder
import android.util.Log
import com.twinspace.virtual.stub.TwinContainerActivity
import java.lang.reflect.Field
import java.lang.reflect.Method

/**
 * TwinInstrumentation:
 * Custom Instrumentation proxy that hooks into ActivityThread.mInstrumentation.
 * 
 * Intercepts activity launches originating from cloned apps, packs the real
 * intent/component into intent extras, and swaps in manifest-registered StubActivity
 * or TwinContainerActivity to pass Android OS AMS/ATMS checks seamlessly.
 */
class TwinInstrumentation private constructor(
    val baseInstrumentation: Instrumentation
) : Instrumentation() {

    companion object {
        private const val TAG = "TwinInstrumentation"
        private var isHooked = false
        private var instance: TwinInstrumentation? = null

        fun install(): Boolean {
            if (isHooked) return true
            return try {
                TwinHiddenApiBypass.unseal()

                // Acquire ActivityThread instance
                val activityThreadClass = Class.forName("android.app.ActivityThread")
                val currentActivityThreadMethod = activityThreadClass.getDeclaredMethod("currentActivityThread")
                currentActivityThreadMethod.isAccessible = true
                val activityThread = currentActivityThreadMethod.invoke(null) ?: return false

                // Get current mInstrumentation
                val instrumentationField: Field = activityThreadClass.getDeclaredField("mInstrumentation")
                instrumentationField.isAccessible = true
                val originalInstrumentation = instrumentationField.get(activityThread) as Instrumentation

                // Install proxy
                val proxy = TwinInstrumentation(originalInstrumentation)
                instrumentationField.set(activityThread, proxy)
                instance = proxy
                isHooked = true
                Log.i(TAG, "TwinInstrumentation successfully hooked into ActivityThread.")
                true
            } catch (e: Throwable) {
                Log.w(TAG, "Failed to hook ActivityThread.mInstrumentation: ${e.message}")
                false
            }
        }
    }

    /**
     * Intercepts execStartActivity with options bundle.
     */
    fun execStartActivity(
        who: Context,
        contextThread: IBinder,
        token: IBinder?,
        target: Activity?,
        intent: Intent,
        requestCode: Int,
        options: Bundle?
    ): ActivityResult? {
        val modifiedIntent = processIntent(who, intent)
        return try {
            val execStartActivityMethod: Method = Instrumentation::class.java.getDeclaredMethod(
                "execStartActivity",
                Context::class.java,
                IBinder::class.java,
                IBinder::class.java,
                Activity::class.java,
                Intent::class.java,
                Int::class.javaPrimitiveType,
                Bundle::class.java
            )
            execStartActivityMethod.isAccessible = true
            execStartActivityMethod.invoke(
                baseInstrumentation,
                who,
                contextThread,
                token,
                target,
                modifiedIntent,
                requestCode,
                options
            ) as? ActivityResult
        } catch (e: Throwable) {
            Log.e(TAG, "Error invoking base execStartActivity", e)
            null
        }
    }

    /**
     * Fallback for older signature without options Bundle.
     */
    fun execStartActivity(
        who: Context,
        contextThread: IBinder,
        token: IBinder?,
        target: Activity?,
        intent: Intent,
        requestCode: Int
    ): ActivityResult? {
        return execStartActivity(who, contextThread, token, target, intent, requestCode, null)
    }

    override fun newActivity(cl: ClassLoader, className: String, intent: Intent): Activity {
        val realActivityName = intent.getStringExtra(TwinContainerActivity.EXTRA_TARGET_ACTIVITY)
        val targetPackage = intent.getStringExtra(TwinContainerActivity.EXTRA_TARGET_PACKAGE)
        val userId = intent.getIntExtra(TwinContainerActivity.EXTRA_USER_ID, -1)

        if (realActivityName != null && targetPackage != null && userId != -1) {
            // Load real activity class through TwinVirtualEngine
            val engine = TwinVirtualEngine.getInstance(null)
            val guestClass = engine?.loadGuestClass(targetPackage, realActivityName)
            if (guestClass != null) {
                try {
                    val activity = super.newActivity(guestClass.classLoader, guestClass.name, intent)
                    Log.d(TAG, "Instantiated target activity: ${guestClass.name}")
                    return activity
                } catch (e: Throwable) {
                    Log.e(TAG, "Failed to instantiate real activity $realActivityName, fallback to stub", e)
                }
            }
        }
        return super.newActivity(cl, className, intent)
    }

    override fun callActivityOnCreate(activity: Activity, icicle: Bundle?) {
        super.callActivityOnCreate(activity, icicle)
    }

    private fun processIntent(context: Context, intent: Intent): Intent {
        val targetComponent = intent.component ?: return intent
        val hostPackage = context.packageName

        // If target is external and not TwinSpace container, wrap it
        if (targetComponent.packageName != hostPackage &&
            !targetComponent.className.startsWith("com.twinspace.virtual.stub")) {
            val stubIntent = Intent(context, TwinContainerActivity::class.java).apply {
                putExtra(TwinContainerActivity.EXTRA_TARGET_PACKAGE, targetComponent.packageName)
                putExtra(TwinContainerActivity.EXTRA_TARGET_ACTIVITY, targetComponent.className)
                putExtra(TwinContainerActivity.EXTRA_ORIGINAL_INTENT, intent)
                flags = intent.flags
            }
            return stubIntent
        }
        return intent
    }
}
