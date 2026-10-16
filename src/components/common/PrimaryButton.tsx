import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, disabled = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <AppText variant="button" color="inverse">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.primary[600],
  },

  pressed: {
    backgroundColor: colors.primary[700],
  },

  disabled: {
    backgroundColor: colors.primary[200],
    opacity: 0.9,
  },
});
