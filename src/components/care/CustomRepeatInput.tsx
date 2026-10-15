import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import type { RepeatUnit } from '@/types/care';
import { formatCustomRepeat, parseCustomRepeat } from '@/utils/care';

const UNITS: { label: string; value: RepeatUnit }[] = [
  { label: '일', value: 'DAY' },
  { label: '주', value: 'WEEK' },
  { label: '개월', value: 'MONTH' },
  { label: '년', value: 'YEAR' },
];

type Props = {
  interval: string;
  onIntervalChange: (interval: string) => void;
  unit: RepeatUnit;
  onUnitChange: (unit: RepeatUnit) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * 사용자 지정 반복 입력 (숫자 + 일/주/개월/년)
 */
export function CustomRepeatInput({
  interval,
  onIntervalChange,
  unit,
  onUnitChange,
  style,
}: Props) {
  const repeat = parseCustomRepeat(interval, unit);

  return (
    <View style={[styles.box, style]}>
      <AppText variant="body2" color="secondary">
        반복 주기를 직접 설정해주세요.
      </AppText>

      <View style={styles.row}>
        <TextInput
          value={interval}
          onChangeText={(value) =>
            onIntervalChange(value.replace(/[^0-9]/g, ''))
          }
          keyboardType="number-pad"
          maxLength={3}
          style={[styles.input, !repeat && styles.inputError]}
        />

        <View style={styles.units}>
          {UNITS.map((item) => {
            const selected = unit === item.value;

            return (
              <Pressable
                key={item.value}
                onPress={() => onUnitChange(item.value)}
                style={[styles.unit, selected && styles.unitSelected]}
              >
                <AppText
                  variant="body2"
                  color={selected ? 'inverse' : 'secondary'}
                >
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <AppText variant="body2" color="secondary">
        {repeat
          ? `${formatCustomRepeat(repeat.interval, repeat.unit)} 반복`
          : '1 이상의 숫자를 입력해주세요.'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: 14,
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  input: {
    width: 64,
    height: 44,
    textAlign: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    fontFamily: 'Pretendard-Regular',
    fontSize: 16,
    color: colors.neutral[900],
  },

  inputError: {
    borderColor: colors.warning[500],
  },

  units: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },

  unit: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },

  unitSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },
});
