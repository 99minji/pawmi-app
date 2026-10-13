import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import { formatKoreanDate } from '@/utils/date';

type Props = {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

export function DateField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={styles.field}>
      {label && <AppText variant="label">{label}</AppText>}

      <Pressable style={styles.button} onPress={() => setShowPicker(true)}>
        <AppText variant="body1">{formatKoreanDate(value)}</AppText>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          presentation="dialog"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onValueChange={(_, selectedDate) => {
            setShowPicker(false);
            onChange(selectedDate);
          }}
          onDismiss={() => {
            setShowPicker(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 10,
  },

  button: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    backgroundColor: colors.neutral[0],
  },
});
