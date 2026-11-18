# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

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
