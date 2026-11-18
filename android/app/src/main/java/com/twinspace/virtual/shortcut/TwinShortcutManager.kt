package com.twinspace.virtual.shortcut

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.util.Log
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import com.twinspace.virtual.stub.TwinContainerActivity

/**
 * TwinShortcutManager:
 * Manages the creation of home-screen shortcuts for cloned applications.
 * 
 * Features:
 * - Direct Launch: Tapping the shortcut opens the cloned instance directly inside
 *   TwinContainerActivity without having to open the TwinSpace manager first.
 * - Visual Badge Overlay: Badges the original app icon with a stylized TwinSpace
 *   gradient emblem in the corner so users can effortlessly distinguish cloned apps
 *   from original apps on their launcher.
 * - Modern Android Compatibility: Fully compatible with Android 8.0 (API 26) through
 *   Android 15 via ShortcutManagerCompat.
 */
class TwinShortcutManager(private val context: Context) {

    companion object {
        private const val TAG = "TwinShortcutManager"
        const val ACTION_SHORTCUT_LAUNCH = "com.twinspace.virtual.ACTION_SHORTCUT_LAUNCH"
    }

    /**
     * Pins a direct shortcut to the device home screen.
     */
    fun pinShortcut(
        cloneId: String,
        packageName: String,
        userId: Int,
        label: String,
        originalIcon: Drawable?
    ): Boolean {
        Log.d(TAG, "Requesting pin shortcut for $cloneId ($label)")

        val pm = context.packageManager
        val launchIntent = pm.getLaunchIntentForPackage(packageName)
        val targetActivity = launchIntent?.component?.className ?: ""

        // Intent that opens the cloned application directly
        val directIntent = Intent(context, TwinContainerActivity::class.java).apply {
            action = ACTION_SHORTCUT_LAUNCH
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(TwinContainerActivity.EXTRA_TARGET_PACKAGE, packageName)
            putExtra(TwinContainerActivity.EXTRA_TARGET_ACTIVITY, targetActivity)
            putExtra(TwinContainerActivity.EXTRA_USER_ID, userId)
            putExtra(TwinContainerActivity.EXTRA_CLONE_ID, cloneId)
            putExtra(TwinContainerActivity.EXTRA_APP_LABEL, label)
        }

        // Generate badged icon
        val badgedBitmap = createBadgedIcon(originalIcon, userId)
        val iconCompat = IconCompat.createWithBitmap(badgedBitmap)

        val shortcutInfo = ShortcutInfoCompat.Builder(context, "twin_${cloneId}")
            .setShortLabel(label)
            .setLongLabel("$label (TwinSpace)")
            .setIcon(iconCompat)
            .setIntent(directIntent)
            .setAlwaysBadged()
            .build()

        return if (ShortcutManagerCompat.isRequestPinShortcutSupported(context)) {
            val callbackIntent = ShortcutManagerCompat.createShortcutResultIntent(context, shortcutInfo)
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val successCallback = PendingIntent.getBroadcast(
                context,
                cloneId.hashCode(),
                callbackIntent,
                flags
            )
            val requested = ShortcutManagerCompat.requestPinShortcut(
                context,
                shortcutInfo,
                successCallback.intentSender
            )
            Log.i(TAG, "Pin shortcut requested for $cloneId: $requested")
            requested
        } else {
            // Legacy fallback for Android 7.x
            try {
                @Suppress("DEPRECATION")
                val legacyIntent = Intent("com.android.launcher.action.INSTALL_SHORTCUT").apply {
                    putExtra(Intent.EXTRA_SHORTCUT_INTENT, directIntent)
                    putExtra(Intent.EXTRA_SHORTCUT_NAME, label)
                    putExtra(Intent.EXTRA_SHORTCUT_ICON, badgedBitmap)
                    putExtra("duplicate", false)
                }
                context.sendBroadcast(legacyIntent)
                Log.i(TAG, "Legacy install shortcut broadcast sent for $cloneId")
                true
            } catch (e: Exception) {
                Log.e(TAG, "Legacy shortcut failed", e)
                false
            }
        }
    }

    /**
     * Draws the original application icon with a circular TwinSpace badge in the bottom-right corner.
     */
    private fun createBadgedIcon(originalDrawable: Drawable?, userId: Int): Bitmap {
        val size = 192
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        // Draw original icon
        if (originalDrawable != null) {
            originalDrawable.setBounds(0, 0, size, size)
            originalDrawable.draw(canvas)
        } else {
            val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.parseColor("#4F46E5")
            }
            canvas.drawCircle(size / 2f, size / 2f, size / 2f, bgPaint)
        }

        // Draw TwinSpace badge circle in bottom-right
        val badgeRadius = size * 0.22f
        val badgeCenterX = size - badgeRadius - 4f
        val badgeCenterY = size - badgeRadius - 4f

        val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            style = Paint.Style.STROKE
            strokeWidth = 6f
        }

        val badgeBgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#6366F1") // Indigo
            style = Paint.Style.FILL
        }

        canvas.drawCircle(badgeCenterX, badgeCenterY, badgeRadius, badgeBgPaint)
        canvas.drawCircle(badgeCenterX, badgeCenterY, badgeRadius, borderPaint)

        // Draw dual-ring twin icon or clone number
        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            textSize = badgeRadius * 1.1f
            textAlign = Paint.Align.CENTER
            isFakeBoldText = true
        }

        val badgeText = "${userId + 1}"
        val textY = badgeCenterY - ((textPaint.descent() + textPaint.ascent()) / 2f)
        canvas.drawText(badgeText, badgeCenterX, textY, textPaint)

        return bitmap
    }
}
