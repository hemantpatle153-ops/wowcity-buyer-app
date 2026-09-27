import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';

import { PHOTO_BLURHASH, PHOTO_TRANSITION } from '@/lib/images';
import { useTheme } from '@/theme/ThemeProvider';

import { Icon } from './Icon';

/**
 * Swipeable photo gallery. Pinch (or double-tap) to zoom; the photo springs
 * back when released so swiping between photos always works.
 */
export function Gallery({ images, name, maxWidth }: { images: string[]; name?: string; maxWidth?: number }) {
  const { colors, reduceMotion } = useTheme();
  const window = useWindowDimensions();
  const width = Math.min(window.width, maxWidth ?? window.width);
  const height = Math.round(width * 1.2);
  const [index, setIndex] = useState(0);
  const [zooming, setZooming] = useState(false);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  if (images.length === 0) {
    return (
      <View style={[styles.empty, { width, height, backgroundColor: colors.surfaceSunken }]} accessibilityLabel="No photo">
        <Icon name="shirt-outline" size={64} color="textMuted" />
      </View>
    );
  }

  return (
    <Animated.View entering={reduceMotion ? undefined : ZoomIn.springify().damping(20).mass(0.8).withInitialValues({ transform: [{ scale: 0.94 }] })}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        scrollEnabled={!zooming && images.length > 1}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(uri, i) => `${i}-${uri}`}
        style={{ width, height }}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item, index: i }) => (
          <ZoomablePhoto
            uri={item}
            width={width}
            height={height}
            label={`${name ?? 'Item'} photo ${i + 1} of ${images.length}`}
            onZoomChange={setZooming}
          />
        )}
      />
      {images.length > 1 ? (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {images.map((uri, i) => (
            <Animated.View
              key={`${i}-${uri}`}
              entering={FadeIn}
              style={[
                styles.dot,
                { backgroundColor: colors.photoChip, width: i === index ? 22 : 7, opacity: i === index ? 1 : 0.6 },
              ]}
            />
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

function ZoomablePhoto({
  uri,
  width,
  height,
  label,
  onZoomChange,
}: {
  uri: string;
  width: number;
  height: number;
  label: string;
  onZoomChange: (zooming: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onStart((e) => {
      onZoomChange(true);
      focalX.value = e.focalX - width / 2;
      focalY.value = e.focalY - height / 2;
    })
    .onUpdate((e) => {
      scale.value = Math.min(4, Math.max(1, e.scale));
      tx.value = focalX.value * (1 - scale.value);
      ty.value = focalY.value * (1 - scale.value);
    })
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 18 });
      tx.value = withSpring(0, { damping: 18 });
      ty.value = withSpring(0, { damping: 18 });
      onZoomChange(false);
    });

  const doubleTap = Gesture.Tap()
    .runOnJS(true)
    .numberOfTaps(2)
    .onEnd((e) => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        onZoomChange(false);
      } else {
        onZoomChange(true);
        const s = 2.2;
        scale.value = withSpring(s, { damping: 16 });
        tx.value = withSpring((e.x - width / 2) * (1 - s), { damping: 16 });
        ty.value = withSpring((e.y - height / 2) * (1 - s), { damping: 16 });
      }
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, doubleTap)}>
      <Animated.View style={[{ width, height }, style]} accessible accessibilityRole="image" accessibilityLabel={label} accessibilityHint="Pinch or double-tap to zoom">
        <Image
          source={{ uri }}
          placeholder={{ blurhash: PHOTO_BLURHASH }}
          contentFit="cover"
          transition={PHOTO_TRANSITION}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', bottom: 28, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 7, borderRadius: 4 },
});
