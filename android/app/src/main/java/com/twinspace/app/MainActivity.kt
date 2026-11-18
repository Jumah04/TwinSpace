package com.twinspace.app

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.twinspace.virtual.core.TwinVirtualEngine

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "main"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        // Set theme before onCreate
        setTheme(R.style.AppTheme)
        super.onCreate(savedInstanceState)
        handleShortcutIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleShortcutIntent(intent)
    }

    private fun handleShortcutIntent(intent: Intent?) {
        val uri = intent?.data ?: return
        if (uri.scheme == "twinspace" && uri.host == "launch") {
            val cloneId = uri.getQueryParameter("cloneId")
            if (!cloneId.isNullOrEmpty()) {
                val engine = TwinVirtualEngine.getInstance(this)
                engine?.launchClone(cloneId)
            }
        }
    }
}
