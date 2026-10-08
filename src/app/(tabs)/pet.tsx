import { router } from 'expo-router';
import {
  CalendarDays,
  ChevronRight,
  HeartPulse,
  Pencil,
  Scale,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { AnimatedPetAvatar } from '@/components/pet/AnimatedPetAvatar';
import { colors } from '@/constants/colors';
import { getPetAvatar } from '@/constants/petAvatars';
import { supabase } from '@/lib/supabase';
import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';
import type { CareRepeat } from '@/types/care';
import { parseDateString } from '@/utils/date';
import { formatGender, formatPetAge } from '@/utils/pet';

export default function PetScreen() {
  const pet = usePetStore((state) => state.pet);

  const records = useHealthStore((state) => state.records);

  const schedules = useCareScheduleStore((state) => state.schedules);

  const petRecords = useMemo(
    () => records.filter((record) => record.petId === pet?.id),
    [records, pet?.id],
  );

  const upcomingSchedules = useMemo(() => {
    if (!pet) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return schedules
      .filter((schedule) => {
        if (schedule.petId !== pet.id || schedule.completedAt) {
          return false;
        }

        return parseDateString(schedule.dueDate) >= today;
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [schedules, pet]);

  if (!pet) {
    return (
      <View style={styles.emptyContainer}>
        <AppText variant="body1" color="secondary">
          등록된 반려동물이 없어요.
        </AppText>
      </View>
    );
  }

  const avatar = getPetAvatar(pet.avatarBreed);

  const avatarSource = avatar.idleBody;

  const tailSource = avatar.idleTail;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert('로그아웃하지 못했어요', '잠시 후 다시 시도해주세요.');

      return;
    }

    // 세션이 사라지면 루트 레이아웃의 Stack.Protected가 로그인 화면으로 보내고,
    // 이전 사용자 데이터는 app/index.tsx에서 비운다.
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="heading1">반려동물</AppText>

        <Pressable
          style={styles.editButton}
          onPress={() => router.push('/pet/edit')}
        >
          <Pencil size={18} color={colors.primary[700]} />
        </Pressable>
      </View>

      {/* Pet Hero */}
      <View style={styles.hero}>
        <View style={styles.avatarGlow} />

        <AnimatedPetAvatar
          size={210}
          source={avatarSource}
          tailSource={tailSource}
        />

        <AppText variant="heading1" style={styles.petName}>
          {pet.name}
        </AppText>

        <AppText variant="body2" color="secondary" style={styles.petMeta}>
          {pet.breed ?? '품종 미등록'} · {formatPetAge(pet)} ·{' '}
          {formatGender(pet.gender)}
        </AppText>
      </View>

      {/* 기본 정보 */}
      <AppText variant="heading2" style={styles.sectionTitle}>
        기본 정보
      </AppText>

      <View style={styles.infoCard}>
        <InfoRow label="이름" value={pet.name} />

        <Divider />

        <InfoRow label="품종" value={pet.breed ?? '품종 미등록'} />

        <Divider />

        <InfoRow label="나이" value={formatPetAge(pet)} />

        <Divider />

        <InfoRow label="성별" value={formatGender(pet.gender)} />
      </View>

      {/* 관리 정보 */}
      <AppText variant="heading2" style={styles.sectionTitle}>
        관리 정보
      </AppText>

      <View style={styles.stats}>
        <StatCard
          icon={<Scale size={20} color={colors.primary[700]} />}
          label="현재 체중"
          value={pet.weightKg ? `${pet.weightKg}kg` : '-'}
        />

        <StatCard
          icon={<HeartPulse size={20} color={colors.primary[700]} />}
          label="건강 기록"
          value={`${petRecords.length}개`}
        />

        <StatCard
          icon={<CalendarDays size={20} color={colors.primary[700]} />}
          label="예정 관리"
          value={`${upcomingSchedules.length}개`}
        />
      </View>

      {/* 예정된 관리 */}
      <View style={styles.sectionHeader}>
        <AppText variant="heading2">예정된 관리</AppText>
      </View>

      {upcomingSchedules.length > 0 ? (
        <View style={styles.scheduleList}>
          {upcomingSchedules.slice(0, 5).map((schedule) => (
            <Pressable
              key={schedule.id}
              style={styles.scheduleCard}
              onPress={() =>
                router.push({
                  pathname: '/care/[id]',
                  params: {
                    id: schedule.id,
                  },
                })
              }
            >
              <View style={styles.scheduleIcon}>
                <CalendarDays size={20} color={colors.primary[700]} />
              </View>

              <View style={styles.scheduleContent}>
                <AppText variant="body1">{schedule.name}</AppText>

                <AppText
                  variant="body2"
                  color="secondary"
                  style={styles.scheduleDate}
                >
                  {formatScheduleDate(schedule.dueDate)}
                </AppText>
              </View>

              <View style={styles.scheduleRight}>
                {schedule.repeat && (
                  <View style={styles.repeatBadge}>
                    <AppText variant="label" color="brand">
                      {formatRepeat(schedule.repeat)}
                    </AppText>
                  </View>
                )}

                <ChevronRight size={18} color={colors.neutral[400]} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.emptyScheduleCard}>
          <View style={styles.emptyScheduleIcon}>
            <CalendarDays size={22} color={colors.primary[700]} />
          </View>

          <View style={{ flex: 1 }}>
            <AppText variant="body1">예정된 관리가 없어요</AppText>

            <AppText
              variant="body2"
              color="secondary"
              style={styles.emptyDescription}
            >
              예방이나 관리 일정을 등록하면 여기에서 확인할 수 있어요.
            </AppText>
          </View>
        </View>
      )}

      <Pressable onPress={handleLogout} style={styles.logoutContent}>
        <AppText
          variant="body1"
          style={{
            color: colors.neutral[0],
          }}
        >
          로그아웃
        </AppText>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText variant="body2" color="secondary">
        {label}
      </AppText>

      <AppText variant="body1">{value}</AppText>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>

      <AppText variant="label" color="secondary">
        {label}
      </AppText>

      <AppText variant="heading2" style={styles.statValue}>
        {value}
      </AppText>
    </View>
  );
}

function formatScheduleDate(dateString: string) {
  return parseDateString(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatRepeat(repeat: CareRepeat) {
  switch (repeat.unit) {
    case 'DAY':
      return repeat.interval === 1 ? '매일' : `${repeat.interval}일마다`;

    case 'WEEK':
      return repeat.interval === 1 ? '매주' : `${repeat.interval}주마다`;

    case 'MONTH':
      return repeat.interval === 1 ? '매월' : `${repeat.interval}개월마다`;

    case 'YEAR':
      return repeat.interval === 1 ? '매년' : `${repeat.interval}년마다`;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
  },

  hero: {
    position: 'relative',
    alignItems: 'center',
    overflow: 'hidden',

    backgroundColor: colors.primary[50],

    borderRadius: 28,

    paddingTop: 12,
    paddingBottom: 24,

    marginBottom: 32,
  },

  avatarGlow: {
    position: 'absolute',
    top: 45,

    width: 170,
    height: 170,
    borderRadius: 85,

    backgroundColor: colors.primary[100],
  },

  petName: {
    marginTop: -8,
  },

  petMeta: {
    marginTop: 4,
  },

  sectionTitle: {
    marginBottom: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 12,
  },

  infoCard: {
    backgroundColor: colors.neutral[0],

    borderRadius: 18,

    borderWidth: 1,
    borderColor: colors.neutral[200],

    paddingHorizontal: 16,

    marginBottom: 32,
  },

  infoRow: {
    minHeight: 56,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
  },

  stats: {
    flexDirection: 'row',
    gap: 10,

    marginBottom: 32,
  },

  statCard: {
    flex: 1,

    minHeight: 120,

    backgroundColor: colors.neutral[0],

    borderRadius: 16,

    padding: 14,
  },

  statIcon: {
    width: 36,
    height: 36,

    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.primary[100],

    marginBottom: 12,
  },

  statValue: {
    marginTop: 4,
  },

  scheduleList: {
    gap: 10,
    marginBottom: 32,
  },

  scheduleCard: {
    minHeight: 72,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: colors.neutral[0],

    borderRadius: 16,

    borderWidth: 1,
    borderColor: colors.neutral[200],

    padding: 14,
  },

  scheduleIcon: {
    width: 40,
    height: 40,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.primary[100],
  },

  scheduleContent: {
    flex: 1,
    marginLeft: 12,
  },

  scheduleDate: {
    marginTop: 4,
  },

  scheduleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  repeatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 10,

    backgroundColor: colors.primary[50],
  },

  emptyScheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 12,

    backgroundColor: colors.neutral[0],

    borderRadius: 16,

    borderWidth: 1,
    borderColor: colors.neutral[200],

    padding: 16,

    marginBottom: 32,
  },

  emptyScheduleIcon: {
    width: 44,
    height: 44,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.primary[100],
  },

  emptyDescription: {
    marginTop: 4,
  },

  profileEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: colors.neutral[0],

    borderRadius: 16,

    padding: 16,
  },

  logoutContent: {
    backgroundColor: colors.error[500],
    borderRadius: 16,
    padding: 16,
    color: colors.neutral[0],
    alignItems: 'center',
  },
});
