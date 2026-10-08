import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import { formatKoreanDate } from '@/utils/date';

type Props = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

/**
 * 라벨 + 날짜 버튼 + DateTimePicker
 */
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
      <AppText variant="label">{label}</AppText>

      <Pressable style={styles.button} onPress={() => setShowPicker(true)}>
        <AppText variant="body1">{formatKoreanDate(value)}</AppText>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          locale="ko-KR"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowPicker(false);
            }

            // Android는 취소(dismissed) 시에도 기존 value로 onChange를 호출한다.
            if (event.type === 'set' && selectedDate) {
              onChange(selectedDate);
            }
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
