import { HeartPulse, Hospital, Pill, ShieldCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import { shadows } from '@/constants/theme';
import type { CareScheduleType } from '@/types/care';

export const CARE_TYPES: { label: string; value: CareScheduleType }[] = [
  { label: '심장사상충', value: 'HEARTWORM' },
  { label: '투약', value: 'MEDICATION' },
  { label: '예방접종', value: 'VACCINATION' },
  { label: '정기검진', value: 'CHECKUP' },
];

type Props = {
  value: CareScheduleType;
  onChange: (value: CareScheduleType) => void;
};

/**
 * 관리 종류 2x2 선택 카드
 */
export function CareTypeSelector({ value, onChange }: Props) {
  return (
    <View style={styles.grid}>
      {CARE_TYPES.map((item) => {
        const selected = value === item.value;

        return (
          <Pressable
            key={item.value}
            style={[styles.card, selected && styles.cardSelected]}
            onPress={() => onChange(item.value)}
          >
            <TypeIcon type={item.value} />

            <AppText variant="body2" color={selected ? 'brand' : 'primary'}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function TypeIcon({ type }: { type: CareScheduleType }) {
  const props = { size: 22, color: colors.primary[700] };

  switch (type) {
    case 'HEARTWORM':
      return <HeartPulse {...props} />;

    case 'MEDICATION':
      return <Pill {...props} />;

    case 'VACCINATION':
      return <ShieldCheck {...props} />;

    case 'CHECKUP':
      return <Hospital {...props} />;
  }
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  card: {
    width: '48%',
    minHeight: 92,
    padding: 16,
    gap: 10,
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.soft,
    backgroundColor: colors.surface.card,
    ...shadows.soft,
  },

  cardSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
});
