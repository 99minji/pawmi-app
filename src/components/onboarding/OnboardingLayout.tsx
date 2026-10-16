import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { AppText } from '../common/AppText';

type Props = {
  step: number;
  total?: number;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function OnboardingLayout({
  step,
  total = 4,
  title,
  description,
  children,
  footer,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View>
          <AppText variant="label" color="brand" style={styles.step}>
            {step} / {total}
          </AppText>

          <AppText variant="display">{title}</AppText>

          {description && (
            <AppText
              variant="body2"
              color="secondary"
              style={styles.description}
            >
              {description}
            </AppText>
          )}
        </View>

        <View style={styles.content}>{children}</View>

        <View style={styles.footer}>{footer}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },

  step: {
    marginBottom: 20,
  },

  description: {
    marginTop: 10,
  },

  content: {
    flex: 1,
    paddingTop: 36,
  },

  footer: {
    marginTop: 20,
  },
});
