# Keep TwinSpace Virtual Engine and Stub Activities
-keep class com.twinspace.virtual.** { *; }
-keepclassmembers class com.twinspace.virtual.** { *; }

# Keep ActivityThread and hidden Android framework reflection targets
-dontwarn android.app.**
-dontwarn dalvik.system.**

# Keep React Native Native Modules
-keepclassmembers class * extends com.facebook.react.bridge.ReactContextBaseJavaModule {
    @com.facebook.react.bridge.ReactMethod *;
}
