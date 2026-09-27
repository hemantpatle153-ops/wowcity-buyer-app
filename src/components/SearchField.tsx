import { forwardRef } from 'react';
import type { TextInput } from 'react-native';

import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { TextField, type TextFieldProps } from './TextField';

export const SearchField = forwardRef<TextInput, Omit<TextFieldProps, 'leading' | 'trailing' | 'look'> & { onClear?: () => void }>(
  function SearchField({ value, onClear, ...rest }, ref) {
    return (
      <TextField
        ref={ref}
        look="filled"
        value={value}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        accessibilityLabel={rest.placeholder ?? 'Search'}
        leading={<Icon name="search" size={20} color="textMuted" />}
        trailing={
          value ? (
            <IconButton icon="close-circle" label="Clear search" onPress={onClear} variant="plain" color="textMuted" size={40} />
          ) : null
        }
        {...rest}
      />
    );
  },
);
