import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import type { RepeatPreset } from '@/utils/care';

type Props = {
  options: { label: string; value: RepeatPreset }[];
  value: RepeatPreset;
  onChange: (value: RepeatPreset) => void;
};

export function RepeatSelector({ options, value, onChange }: Props) {
  return (
    <View style={styles.options}>
      {options.map((item) => {
        const selected = value === item.value;

        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <AppText variant="body2" color={selected ? 'brand' : 'primary'}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  option: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },

  optionSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
});
