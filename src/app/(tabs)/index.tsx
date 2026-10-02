import {
  Bell,
  ChevronRight,
  HeartPulse,
  Pill,
  Plus,
} from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { AnimatedPetAvatar } from '@/components/pet/AnimatedPetAvatar';
import { QuickRecordSheet } from '@/components/record/QuickRecordSheet';
import { colors } from '@/constants/colors';
import { petAvatars } from '@/constants/petAvatars';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';
import { formatGender, formatPetAge } from '@/utils/pet';
import BottomSheet from '@gorhom/bottom-sheet';
import { useMemo, useRef } from 'react';

export default function TodayScreen() {
  const pet = usePetStore((state) => state.pet);

  if (!pet) {
    return (
      <View style={styles.emptyContainer}>
        <AppText variant="body1" color="secondary">
          반려동물 정보를 불러오고 있어요.
        </AppText>
      </View>
    );
  }
  const avatar =
    pet.avatarBreed === 'POMERANIAN' ? petAvatars.POMERANIAN.idle : undefined;

  const allRecords = useHealthStore((state) => state.records);

  const records = useMemo(
    () => allRecords.filter((record) => record.petId === pet?.id),
    [allRecords, pet?.id],
  );

  const quickRecordSheetRef = useRef<BottomSheet>(null);

  const openQuickRecordSheet = () => {
    quickRecordSheetRef.current?.expand();
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTitleArea}>
              <AppText variant="label" color="brand" style={styles.heroEyebrow}>
                오늘의 포우미
              </AppText>

              <AppText variant="heading1">
                오늘도 {pet.name}의 하루를{'\n'}
                챙겨볼까요?
              </AppText>
            </View>

            <Pressable style={styles.iconButton}>
              <Bell size={22} color={colors.neutral[800]} />
            </Pressable>
          </View>

          <View style={styles.avatarArea}>
            <View style={styles.avatarGlow} />

            {avatar ? (
              <AnimatedPetAvatar size={220} />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
          </View>

          <View style={styles.petSummary}>
            <View style={styles.petSummaryText}>
              <AppText variant="heading2">{pet.name}</AppText>

              <AppText
                variant="body2"
                color="secondary"
                style={styles.petDescription}
              >
                {pet.breed ?? '포메라니안'} · {formatPetAge(pet)} ·{' '}
                {formatGender(pet.gender)}
              </AppText>
            </View>

            <Pressable
              style={styles.profileButton}
              onPress={() => {
                // 나중에 Pet Profile 이동
              }}
            >
              <ChevronRight size={20} color={colors.primary[700]} />
            </Pressable>
          </View>
        </View>

        <AppText variant="heading2" style={styles.sectionTitle}>
          오늘 할 일
        </AppText>

        <View style={styles.taskCard}>
          <View style={styles.taskIcon}>
            <Pill size={20} color={colors.primary[700]} />
          </View>

          <View style={styles.taskContent}>
            <AppText variant="body1">심장사상충 예방하는 날이에요</AppText>

            <AppText
              variant="label"
              color="tertiary"
              style={styles.taskDescription}
            >
              오늘 예정
            </AppText>
          </View>

          <Pressable style={styles.completeButton}>
            <AppText variant="label" color="inverse">
              완료
            </AppText>
          </Pressable>
        </View>

        <AppText variant="heading2" style={styles.sectionTitle}>
          최근 변화
        </AppText>

        <View style={styles.insightCard}>
          <HeartPulse size={22} color={colors.primary[700]} />

          <View style={styles.insightContent}>
            <AppText variant="body1">
              최근 3개월 동안 체중이 0.3kg 늘었어요
            </AppText>

            <AppText
              variant="body2"
              color="secondary"
              style={styles.insightDescription}
            >
              이전 기록과 함께 확인해보세요.
            </AppText>
          </View>
        </View>

        <AppText variant="heading2" style={styles.sectionTitle}>
          빠른 기록
        </AppText>

        <Pressable
          style={styles.quickRecordButton}
          onPress={openQuickRecordSheet}
        >
          <View style={styles.quickRecordIcon}>
            <Plus size={22} color={colors.primary[700]} />
          </View>

          <View style={styles.quickRecordContent}>
            <AppText variant="body1">건강 기록 추가하기</AppText>

            <AppText
              variant="body2"
              color="secondary"
              style={styles.quickRecordDescription}
            >
              체중, 증상, 투약 등을 빠르게 남겨보세요.
            </AppText>
          </View>

          <ChevronRight size={20} color={colors.neutral[400]} />
        </Pressable>

        <AppText variant="heading2" style={styles.sectionTitle}>
          최근 기록
        </AppText>

        {records.length === 0 ? (
          <AppText variant="body2" color="secondary">
            아직 기록이 없어요.
          </AppText>
        ) : (
          <View style={styles.recentList}>
            {records.slice(0, 3).map((record) => (
              <View key={record.id} style={styles.recentRecord}>
                <AppText variant="body1">{record.title}</AppText>

                <AppText variant="body2" color="secondary">
                  {new Date(record.occurredAt).toLocaleDateString('ko-KR')}
                </AppText>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <QuickRecordSheet ref={quickRecordSheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 28,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
  },

  hero: {
    backgroundColor: colors.primary[50],
    borderRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 18,
    marginBottom: 32,
    overflow: 'hidden',
  },

  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },

  heroTitleArea: {
    flex: 1,
  },

  heroEyebrow: {
    marginBottom: 8,
  },

  avatarArea: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  avatarGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primary[100],
  },

  heroAvatar: {
    width: 220,
    height: 220,
  },

  avatarPlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primary[100],
  },

  petSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  petSummaryText: {
    flex: 1,
  },

  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  petImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
  },

  petInfo: {
    flex: 1,
    marginLeft: 12,
  },

  petDescription: {
    marginTop: 4,
  },

  sectionTitle: {
    marginBottom: 12,
    marginTop: 4,
  },

  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
  },

  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  taskContent: {
    flex: 1,
    marginLeft: 12,
  },

  taskDescription: {
    marginTop: 4,
  },

  completeButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.primary[600],
  },

  insightCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary[100],
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
  },

  insightContent: {
    flex: 1,
    marginLeft: 12,
  },

  insightDescription: {
    marginTop: 4,
  },

  recentList: {
    gap: 10,
  },

  recentRecord: {
    backgroundColor: colors.neutral[0],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 16,
    gap: 4,
  },

  quickRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral[0],
    marginBottom: 28,
  },

  quickRecordIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  quickRecordContent: {
    flex: 1,
    marginLeft: 12,
  },

  quickRecordDescription: {
    marginTop: 4,
  },
});
