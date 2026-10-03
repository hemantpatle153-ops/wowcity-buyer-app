import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

import { IconButton } from './IconButton';
import { Text } from './Text';

const SPRING = { damping: 26, stiffness: 260, mass: 0.9 };

/**
 * Spring-animated bottom sheet with a drag handle (swipe down to close),
 * a tappable backdrop, an optional sticky footer and scrollable content.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  footer,
  maxHeightRatio = 0.88,
  testID,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxHeightRatio?: number;
  testID?: string;
}) {
  const { colors, radius, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  // Mount as soon as we become visible (render-time state adjustment, no effect needed).
  if (visible && !mounted) setMounted(true);
  const translate = useSharedValue(height);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translate.value = height;
      requestAnimationFrame(() => {
        translate.value = reduceMotion ? withTiming(0, { duration: 1 }) : withSpring(0, SPRING);
        backdrop.value = withTiming(1, { duration: reduceMotion ? 1 : 200 });
      });
    } else if (mounted) {
      backdrop.value = withTiming(0, { duration: reduceMotion ? 1 : 180 });
      translate.value = withTiming(height, { duration: reduceMotion ? 1 : 220 }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = Gesture.Pan()
    .onChange((e) => {
      translate.set(Math.max(0, translate.get() + e.changeY));
    })
    .onEnd((e) => {
      if (translate.get() > 120 || e.velocityY > 900) runOnJS(onClose)();
      else translate.set(withSpring(0, SPRING));
    });

  // Lift the sheet with the keyboard so text boxes inside stay visible (height is negative while it is open).
  const keyboard = useReanimatedKeyboardAnimation();
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translate.value + keyboard.height.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  if (!mounted) return null;
  return (
    <Modal transparent visible statusBarTranslucent navigationBarTranslucent onRequestClose={onClose} animationType="none">
      <GestureHandlerRootView style={styles.fill}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }, backdropStyle]}>
          <Pressable
            style={styles.fill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>
        <Animated.View
          testID={testID}
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              maxHeight: height * maxHeightRatio,
              backgroundColor: colors.surfaceRaised,
              borderTopLeftRadius: radius.sheet,
              borderTopRightRadius: radius.sheet,
              paddingBottom: footer ? 0 : Math.max(insets.bottom, 16),
              shadowColor: colors.shadow,
            },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <View style={styles.header} accessibilityRole="header">
              <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
              {title ? (
                <View style={styles.titleRow}>
                  <Text variant="title" style={styles.title}>
                    {title}
                  </Text>
                  <IconButton icon="close" label="Close" onPress={onClose} variant="plain" />
                </View>
              ) : null}
            </View>
          </GestureDetector>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentInner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer ? (
            <View
              style={[
                styles.footer,
                { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) },
              ]}
            >
              {footer}
            </View>
          ) : null}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 24,
    ...(Platform.OS === 'web' ? { maxWidth: 640, alignSelf: 'center', marginHorizontal: 'auto' } : null),
  },
  header: { paddingTop: 10, paddingHorizontal: 20 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1 },
  content: { flexGrow: 0 },
  contentInner: { paddingHorizontal: 20, paddingBottom: 16 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12 },
});
