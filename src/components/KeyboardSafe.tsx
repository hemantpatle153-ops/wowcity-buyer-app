import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

/**
 * Keeps its content above the on-screen keyboard. Android draws edge to edge, so the window no longer
 * resizes for the keyboard; this pads by the real keyboard height on both platforms.
 */
export function KeyboardSafe({ children, style, testID }: { children: ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  return (
    <KeyboardAvoidingView behavior="padding" style={[{ flex: 1 }, style]} testID={testID}>
      {children}
    </KeyboardAvoidingView>
  );
}
