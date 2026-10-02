import { StyleProp, Text, TextProps, TextStyle } from 'react-native';

import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

type TextVariant =
  | 'display'
  | 'heading1'
  | 'heading2'
  | 'body1'
  | 'body2'
  | 'label'
  | 'button';

type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'brand'
  | 'inverse'
  | 'error'
  | 'warning'
  | 'success';

type Props = TextProps & {
  variant?: TextVariant;
  color?: TextColor;
  style?: StyleProp<TextStyle>;
};

const textColors: Record<TextColor, string> = {
  primary: colors.neutral[900],
  secondary: colors.neutral[600],
  tertiary: colors.neutral[500],
  brand: colors.primary[600],
  inverse: colors.neutral[0],
  error: colors.error[500],
  warning: colors.warning[500],
  success: colors.success[500],
};

export function AppText({
  variant = 'body1',
  color = 'primary',
  style,
  children,
  ...props
}: Props) {
  return (
    <Text
      {...props}
      style={[typography[variant], { color: textColors[color] }, style]}
    >
      {children}
    </Text>
  );
}
