import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import type { HealthRecordType } from '@/types/health';
import { HEALTH_RECORD_TYPE_LABELS } from '@/utils/health';

export type RecordFilter = 'ALL' | HealthRecordType;

const FILTERS: { label: string; value: RecordFilter }[] = [
  { label: '전체', value: 'ALL' },
  ...(
    Object.entries(HEALTH_RECORD_TYPE_LABELS) as [HealthRecordType, string][]
  ).map(([value, label]) => ({ label, value })),
];

type Props = {
  value: RecordFilter;
  onChange: (value: RecordFilter) => void;
};

export function RecordFilterChips({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filters}
    >
      {FILTERS.map((item) => {
        const selected = value === item.value;

        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <AppText variant="body2" color={selected ? 'inverse' : 'secondary'}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filters: {
    gap: 8,
    paddingBottom: 24,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.input,
    backgroundColor: colors.surface.card,
  },

  chipSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },
});
