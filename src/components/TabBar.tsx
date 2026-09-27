import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { useHaptics } from '@/hooks/useHaptics';
import { useSaved } from '@/state/saved';
import { useTheme } from '@/theme/ThemeProvider';

import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

const ICONS: Record<string, [IconName, IconName]> = {
  home: ['sparkles-outline', 'sparkles'],
  search: ['search-outline', 'search'],
  shops: ['storefront-outline', 'storefront'],
  saved: ['heart-outline', 'heart'],
  account: ['person-circle-outline', 'person-circle'],
};

/** Floating, one-handed tab bar with a springy active pill and haptic selection. */
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { colors, reduceMotion } = useTheme();
  const haptics = useHaptics();
  const savedCount = useSaved((s) => Object.keys(s.keys).length);

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10), backgroundColor: colors.bg, borderTopColor: colors.border }]}>
      <View style={styles.bar} accessibilityRole="tablist">
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const { options } = descriptors[route.key];
          const label = typeof options.title === 'string' ? options.title : route.name;
          const [off, on] = ICONS[route.name] ?? ['ellipse-outline', 'ellipse'];
          const badge = route.name === 'saved' && savedCount > 0 ? savedCount : null;
          return (
            <PressableScale
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={badge ? `${label}, ${badge} items` : label}
              scaleTo={0.92}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  haptics.select();
                  navigation.navigate(route.name, route.params);
                }
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.item}
            >
              <TabPill focused={focused} color={colors.accentSoft} reduceMotion={reduceMotion}>
                <Icon name={focused ? on : off} size={22} color={focused ? 'accent' : 'textMuted'} />
                {badge ? (
                  <View style={[styles.badge, { backgroundColor: colors.heart, borderColor: colors.bg }]}>
                    <Text variant="caption" style={[styles.badgeText, { color: colors.bg }]} numeric>
                      {badge > 99 ? '99+' : badge}
                    </Text>
                  </View>
                ) : null}
              </TabPill>
              <Text variant="caption" tone={focused ? 'accent' : 'muted'} weight={focused ? '700' : '500'} numberOfLines={1}>
                {label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

function TabPill({ focused, color, reduceMotion, children }: { focused: boolean; color: string; reduceMotion: boolean; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => ({
    opacity: withSpring(focused ? 1 : 0, { damping: 20 }),
    transform: [{ scaleX: reduceMotion ? 1 : withSpring(focused ? 1 : 0.5, { damping: 16, stiffness: 220 }) }],
  }));
  return (
    <View style={styles.pillWrap}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.pill, { backgroundColor: color }, style]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
  bar: { flexDirection: 'row', paddingHorizontal: 6 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 56, gap: 2 },
  pillWrap: { width: 56, height: 32, alignItems: 'center', justifyContent: 'center' },
  pill: { borderRadius: 16 },
  badge: {
    position: 'absolute',
    top: -2,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  badgeText: { fontSize: 10, lineHeight: 12, fontWeight: '800' },
});
