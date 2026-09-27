import Constants from 'expo-constants';

type Extra = { mapEnabled?: boolean; privacyPolicyUrl?: string };
const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/** Map of nearby shops (react-native-maps). Off unless EXPO_PUBLIC_ENABLE_MAP=1. */
export const MAP_ENABLED = process.env.EXPO_PUBLIC_ENABLE_MAP === '1' || extra.mapEnabled === true;
export const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? extra.privacyPolicyUrl ?? 'https://wowcity.in/privacy';
