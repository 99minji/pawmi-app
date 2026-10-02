import {
  CalendarDays,
  ChevronRight,
  PawPrint,
  Scale,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import { usePetStore } from '@/stores/usePetStore';

export default function PetScreen() {
  const pet = usePetStore((state) => state.pet);

  if (!pet) {
    return (
      <View style={styles.container}>
        <AppText variant="heading1">반려동물</AppText>

        <AppText variant="body1" color="secondary" style={styles.emptyText}>
          등록된 반려동물이 없어요.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppText variant="heading1">반려동물</AppText>

      <View style={styles.profile}>
        <View style={styles.profileImage}>
          <PawPrint size={32} color={colors.primary[600]} />
        </View>

        <AppText variant="heading2" style={styles.name}>
          {pet.name}
        </AppText>

        <AppText variant="body2" color="secondary">
          {pet.species === 'DOG' ? '강아지' : '고양이'}
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="heading2" style={styles.sectionTitle}>
          기본 정보
        </AppText>

        <InfoRow
          icon={<CalendarDays size={20} color={colors.primary[600]} />}
          label="생일"
          value={pet.birthDate}
        />

        <InfoRow
          icon={<PawPrint size={20} color={colors.primary[600]} />}
          label="성별"
          value={pet.gender === 'MALE' ? '남아' : '여아'}
        />

        <InfoRow
          icon={<Scale size={20} color={colors.primary[600]} />}
          label="현재 체중"
          value={pet.weightKg ? `${pet.weightKg}kg` : '아직 기록이 없어요'}
        />
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon}

        <AppText variant="body1" style={styles.rowLabel}>
          {label}
        </AppText>
      </View>

      <View style={styles.rowRight}>
        <AppText variant="body2" color="secondary">
          {value}
        </AppText>

        <ChevronRight size={18} color={colors.neutral[400]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    paddingTop: 64,
    paddingHorizontal: 20,
  },

  emptyText: {
    marginTop: 12,
  },

  profile: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },

  profileImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  name: {
    marginTop: 16,
  },

  section: {
    gap: 4,
  },

  sectionTitle: {
    marginBottom: 12,
  },

  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    paddingHorizontal: 16,
    borderRadius: 14,
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowLabel: {
    marginLeft: 12,
  },

  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
