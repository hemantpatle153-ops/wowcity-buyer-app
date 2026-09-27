import type { ConfigContext, ExpoConfig } from 'expo/config';

const LOCATION_REASON = 'WowCity uses your location to show shops and clothes near you.';

// Optional map of nearby shops. Android needs a Google Maps API key
// (GOOGLE_MAPS_ANDROID_API_KEY, set as an EAS secret) when this is on.
const mapEnabled = process.env.EXPO_PUBLIC_ENABLE_MAP === '1';
const androidMapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'WowCity',
  slug: 'wowcity',
  scheme: 'wowcity',
  version: '1.0.0',
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
    adaptiveIcon: {
      backgroundColor: '#1F5FD1',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    blockedPermissions: ['ACCESS_BACKGROUND_LOCATION'],
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
    'expo-secure-store',
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
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    mapEnabled,
    privacyPolicyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://wowcity.in/privacy',
  },
});
