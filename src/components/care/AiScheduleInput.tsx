import { Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';

type Props = {
  value: string;
  onChange: (value: string) => void;
  analyzing: boolean;
  onAnalyze: () => void;
};

/**
 * "포우미에게 말해보세요" 자연어 일정 입력 카드
 */
export function AiScheduleInput({
  value,
  onChange,
  analyzing,
  onAnalyze,
}: Props) {
  const disabled = !value.trim() || analyzing;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Sparkles size={18} color={colors.primary[700]} />
        </View>

        <View style={styles.titleArea}>
          <AppText variant="body1">포우미에게 말해보세요</AppText>

          <AppText variant="body2" color="secondary" style={styles.description}>
            평소 말하듯 적으면 일정으로 정리해드려요.
          </AppText>
        </View>
      </View>

      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="예: 매일 저녁 8시에 심장약 1정 먹여야 해"
        placeholderTextColor={colors.neutral[400]}
        multiline
        textAlignVertical="top"
        editable={!analyzing}
        style={styles.input}
      />

      <Pressable
        disabled={disabled}
        onPress={onAnalyze}
        style={({ pressed }) => [
          styles.button,
          disabled && styles.buttonDisabled,
          pressed && !analyzing && styles.buttonPressed,
        ]}
      >
        <Sparkles size={16} color={colors.neutral[0]} />

        <AppText variant="label" color="inverse">
          {analyzing ? '정리 중...' : '일정으로 정리하기'}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 32,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  titleArea: {
    flex: 1,
    marginLeft: 12,
  },

  description: {
    marginTop: 3,
  },

  input: {
    minHeight: 96,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: 14,
    backgroundColor: colors.neutral[0],
    fontFamily: 'Pretendard-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.neutral[900],
  },

  button: {
    minHeight: 46,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  buttonPressed: {
    opacity: 0.8,
  },
});
