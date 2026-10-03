import type { ConfigContext, ExpoConfig } from 'expo/config';

const MIC_REASON = 'WowCity uses the microphone only when you tap the mic to tell Sarah what you are looking for.';
const SPEECH_REASON = 'WowCity turns what you say to Sarah into text.';
const LOCATION_REASON = 'WowCity uses your location to show shops and clothes near you.';

// Optional map of nearby shops. Android needs a Google Maps API key
// (GOOGLE_MAPS_ANDROID_API_KEY, set as an EAS secret) when this is on.
const mapEnabled = process.env.EXPO_PUBLIC_ENABLE_MAP === '1';
const androidMapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

// A store build must know its server and never fall back to demo data.
if (process.env.EAS_BUILD_PROFILE === 'production' && !process.env.EXPO_PUBLIC_API_URL) {
  throw new Error('Set EXPO_PUBLIC_API_URL for the production profile (EAS → Environment variables) before building.');
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'WowCity',
  slug: 'wowcity',
  scheme: 'wowcity',
  version: '1.0.3',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#FAF9F7',
  ios: {
    bundleIdentifier: 'com.luzzan.wowcity',
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: LOCATION_REASON,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.luzzan.wowcity',
    versionCode: 4,
    adaptiveIcon: {
      backgroundColor: '#FF6A3D',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    blockedPermissions: [
      'ACCESS_BACKGROUND_LOCATION',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'SYSTEM_ALERT_WINDOW',
    ],
    predictiveBackGestureEnabled: false,
    ...(mapEnabled && androidMapsKey
      ? { config: { googleMaps: { apiKey: androidMapsKey } } }
      : {}),
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
    output: 'single',
  },
  plugins: [
    'expo-router',
    // No biometrics are used, so no Face ID prompt text.
    ['expo-secure-store', { faceIDPermission: false }],
    'expo-image',
    'expo-sharing',
    'expo-web-browser',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 160,
        resizeMode: 'contain',
        backgroundColor: '#FAF9F7',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#15171A' },
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: LOCATION_REASON,
        // Only "while using the app" is ever requested.
        locationAlwaysAndWhenInUsePermission: false,
        locationAlwaysPermission: false,
        motionUsagePermission: false,
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
        isAndroidMotionActivityEnabled: false,
      },
    ],
    ['expo-speech-recognition', { microphonePermission: MIC_REASON, speechRecognitionPermission: SPEECH_REASON }],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    mapEnabled,
    privacyPolicyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://wowcity.in/privacy',
  },
});
