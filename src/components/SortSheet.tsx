import { StyleSheet, View } from 'react-native';

import type { SortOption } from '@/api/types';
import { SORT_LABELS } from '@/features/searchFilters';
import { useTheme } from '@/theme/ThemeProvider';

import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

const ORDER: SortOption[] = ['nearest', 'newest', 'price_low', 'price_high'];

export function SortSheet({
  visible,
  onClose,
  value,
  onChange,
  canSortByDistance,
}: {
  visible: boolean;
  onClose: () => void;
  value: SortOption;
  onChange: (s: SortOption) => void;
  canSortByDistance: boolean;
}) {
  const { colors, radius } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Sort by">
      <View style={styles.list} accessibilityRole="radiogroup">
        {ORDER.filter((o) => o !== 'nearest' || canSortByDistance).map((o) => {
          const selected = value === o;
          return (
            <PressableScale
              key={o}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={SORT_LABELS[o]}
              haptic="select"
              scaleTo={0.98}
              onPress={() => {
                onChange(o);
                onClose();
              }}
              style={[
                styles.option,
                { borderRadius: radius.control + 4, backgroundColor: selected ? colors.accentSoft : 'transparent' },
              ]}
            >
              <Text variant="bodyLarge" tone={selected ? 'accent' : 'default'} weight={selected ? '700' : '400'} style={styles.flex}>
                {SORT_LABELS[o]}
              </Text>
              {selected ? <Icon name="checkmark" size={22} color="accent" /> : null}
            </PressableScale>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 4, marginTop: 8 },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: 14 },
  flex: { flex: 1 },
});
