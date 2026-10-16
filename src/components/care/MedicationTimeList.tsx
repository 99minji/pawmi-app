import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import { isValidTime } from '@/utils/care';
import { DEFAULT_NOTIFICATION_TIME } from '@/utils/notification';

type Props = {
  times: string[];
  onChange: (times: string[]) => void;
};

/**
 * 투약 시간 목록 (하루 여러 번 투약)
 *
 * 최소 1개는 남겨두고, 형식이 틀린 시간은 테두리로 표시한다.
 */
export function MedicationTimeList({ times, onChange }: Props) {
  const allValid = times.length > 0 && times.every(isValidTime);

  const changeTime = (index: number, value: string) => {
    onChange(times.map((time, i) => (i === index ? value : time)));
  };

  const addTime = () => {
    onChange([...times, DEFAULT_NOTIFICATION_TIME]);
  };

  const removeTime = (index: number) => {
    if (times.length <= 1) {
      return;
    }

    onChange(times.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <AppText variant="heading2">투약 시간</AppText>

          <AppText variant="body2" color="secondary" style={styles.description}>
            하루에 여러 번 투약한다면 시간을 추가해주세요.
          </AppText>
        </View>

        <Pressable onPress={addTime} style={styles.addButton}>
          <AppText variant="label" color="brand">
            + 시간 추가
          </AppText>
        </Pressable>
      </View>

      <View style={styles.list}>
        {times.map((time, index) => (
          <View key={index} style={styles.row}>
            <TextInput
              value={time}
              onChangeText={(value) => changeTime(index, value)}
              placeholder="09:00"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              style={[styles.input, !isValidTime(time) && styles.inputError]}
            />

            {times.length > 1 && (
              <Pressable
                onPress={() => removeTime(index)}
                style={styles.removeButton}
              >
                <AppText variant="body2" color="secondary">
                  삭제
                </AppText>
              </Pressable>
            )}
          </View>
        ))}
      </View>

      {!allValid && (
        <AppText variant="body2" color="secondary">
          시간을 08:00처럼 입력해주세요.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },

  description: {
    marginTop: 4,
  },

  addButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary[50],
  },

  list: {
    gap: 10,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border.input,
    borderRadius: 16,
    backgroundColor: colors.surface.card,
    fontFamily: 'Pretendard-Regular',
    fontSize: 16,
    color: colors.neutral[900],
  },

  inputError: {
    borderColor: colors.warning[500],
  },

  removeButton: {
    height: 52,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
