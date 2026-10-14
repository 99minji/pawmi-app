import { router } from 'expo-router';
import { CalendarDays, ChevronRight, Pencil, Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import { getPetAvatar } from '@/constants/petAvatars';
import { supabase } from '@/lib/supabase';
import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { usePetStore } from '@/stores/usePetStore';
import type { CareRepeat } from '@/types/care';
import { parseDateString } from '@/utils/date';
import { formatBreed, formatGender, formatPetAge } from '@/utils/pet';

export default function PetScreen() {
  const pet = usePetStore((state) => state.pet);

  const schedules = useCareScheduleStore((state) => state.schedules);

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

  const openCareCreate = () => {
    router.push('/care/create');
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert('로그아웃하지 못했어요', '잠시 후 다시 시도해주세요.');

      return;
    }
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

        <Image
          source={avatar.idle}
          style={styles.avatar}
          resizeMode="contain"
        />

        <AppText variant="heading1" style={styles.petName}>
          {pet.name}
        </AppText>

        <AppText variant="body2" color="secondary" style={styles.petMeta}>
          {formatBreed(pet)} · {formatPetAge(pet)}
        </AppText>
      </View>

      {/* 기본 정보 */}
      <AppText variant="heading2" style={styles.sectionTitle}>
        기본 정보
      </AppText>

      <View style={styles.infoCard}>
        <InfoRow label="품종" value={formatBreed(pet)} />

        <Divider />

        <InfoRow label="나이" value={formatPetAge(pet)} />

        <Divider />

        <InfoRow label="성별" value={formatGender(pet.gender)} />
      </View>

      {/* 예정된 관리 */}
      <View style={styles.sectionHeader}>
        <AppText variant="heading2">예정된 관리</AppText>

        <Pressable
          style={styles.addScheduleButton}
          onPress={openCareCreate}
          hitSlop={8}
        >
          <Plus size={16} color={colors.primary[700]} />

          <AppText variant="label" color="brand">
            일정 예약
          </AppText>
        </Pressable>
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
        <Pressable style={styles.emptyScheduleCard} onPress={openCareCreate}>
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
              심장사상충, 접종, 검진 일정을 등록해두면 앞으로의 관리를 한눈에
              확인할 수 있어요.
            </AppText>
          </View>

          <ChevronRight size={18} color={colors.neutral[400]} />
        </Pressable>
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

  avatar: {
    width: 210,
    height: 210,
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

  addScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.primary[50],
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

  logoutContent: {
    backgroundColor: colors.error[500],
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
});
