import { router } from 'expo-router';
import {
  Brain,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  LogOut,
  ShieldPlus,
  Sparkles,
  Stethoscope,
  Users,
  UserX,
} from 'lucide-react-native';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import { getPetAvatar } from '@/constants/petAvatars';
import { supabase } from '@/lib/supabase';
import { deleteAccount } from '@/services/auth';
import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { usePetStore } from '@/stores/usePetStore';
import type { Pet } from '@/types/pet';
import { cancelAllCareNotifications } from '@/utils/notification';
import { formatBreed, formatGender, formatPetAge } from '@/utils/pet';

type MenuItemProps = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
  iconStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

function MenuItem({
  icon,
  title,
  description,
  iconStyle,
  badge,
  disabled,
  onPress,
}: MenuItemProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && !disabled && styles.menuItemPressed,
      ]}
    >
      <View
        style={[styles.menuIcon, disabled && styles.menuIconNeutral, iconStyle]}
      >
        {icon}
      </View>

      <View style={styles.menuText}>
        <AppText variant="body1" color={disabled ? 'secondary' : 'primary'}>
          {title}
        </AppText>

        {description ? (
          <AppText
            variant="body2"
            color={disabled ? 'tertiary' : 'secondary'}
            style={styles.menuDescription}
          >
            {description}
          </AppText>
        ) : null}
      </View>

      <View style={styles.menuRight}>
        {badge ? (
          <View style={styles.badge}>
            <AppText variant="label" color="secondary">
              {badge}
            </AppText>
          </View>
        ) : null}

        {!disabled ? (
          <ChevronRight size={20} color={colors.neutral[400]} />
        ) : null}
      </View>
    </Pressable>
  );
}

// 탭하면 반려동물 정보/수정 화면으로 이동하는 프로필 카드
function PetProfileCard({ pet }: { pet: Pet }) {
  const avatar = getPetAvatar(pet.avatarBreed);

  return (
    <Pressable
      onPress={() => router.push('/pet')}
      style={({ pressed }) => [
        styles.profileCard,
        pressed && styles.menuItemPressed,
      ]}
    >
      <View style={styles.profileAvatar}>
        <Image
          source={avatar.idle}
          style={styles.profileAvatarImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.profileText}>
        <AppText variant="heading2">{pet.name}</AppText>

        <AppText variant="body2" color="secondary" style={styles.profileMeta}>
          {formatBreed(pet)} · {formatPetAge(pet)} · {formatGender(pet.gender)}
        </AppText>
      </View>

      <View style={styles.profileChevron}>
        <ChevronRight size={20} color={colors.primary[700]} />
      </View>
    </Pressable>
  );
}

export default function MenuScreen() {
  const pet = usePetStore((state) => state.pet);

  /**
   * 로그아웃
   *
   * 이전 계정의 예약 알림과 화면 데이터가 다음 계정에 남지 않도록
   * 알림 취소 → store 초기화 → signOut 순서로 처리한다.
   */
  const handleLogout = async () => {
    await cancelAllCareNotifications();

    useNotificationStore.getState().clearPendingScheduleId();
    usePetStore.getState().clearPet();
    useHealthStore.getState().clearRecords();
    useCareScheduleStore.getState().clearSchedules();

    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert('로그아웃하지 못했어요', '잠시 후 다시 시도해주세요.');

      // 세션이 남아 있으므로 데이터를 다시 불러온다.
      router.replace('/');

      return;
    }
  };

  // 메뉴 하단에 바로 노출돼 있어 오터치로 로그아웃되지 않도록 한 번 확인한다.
  const confirmLogout = () => {
    Alert.alert('로그아웃', '포우미에서 로그아웃할까요?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: handleLogout,
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();

      // 서버에서 계정 삭제 성공 후 로컬 데이터 정리
      await cancelAllCareNotifications();

      useNotificationStore.getState().clearPendingScheduleId();

      usePetStore.getState().clearPet();

      useHealthStore.getState().clearRecords();

      useCareScheduleStore.getState().clearSchedules();

      // 삭제된 계정의 로컬 세션 제거
      await supabase.auth.signOut();

      router.replace('/');
    } catch (error) {
      console.error('DELETE ACCOUNT ERROR:', error);

      Alert.alert('회원 탈퇴에 실패했어요', '잠시 후 다시 시도해주세요.');
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '탈퇴하면 반려동물 정보와 건강 기록, 예정된 관리 일정이 모두 삭제돼요.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '계속',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '정말 탈퇴할까요?',
              '삭제된 계정과 기록은 복구할 수 없어요.',
              [
                {
                  text: '취소',
                  style: 'cancel',
                },
                {
                  text: '회원 탈퇴',
                  style: 'destructive',
                  onPress: handleDeleteAccount,
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <AppText variant="heading1">전체 메뉴</AppText>

        <AppText variant="body1" color="secondary" style={styles.description}>
          포우미의 관리 기능을 한곳에서 확인해보세요.
        </AppText>
      </View>

      {pet && <PetProfileCard pet={pet} />}

      <View style={styles.section}>
        <AppText variant="body2" color="secondary" style={styles.sectionTitle}>
          건강 관리
        </AppText>

        <View style={styles.card}>
          <MenuItem
            icon={<HeartPulse size={22} color={colors.primary[600]} />}
            title="건강 기록"
            description="체중, 증상, 투약, 접종, 진료 기록"
            onPress={() => {
              router.push('/(tabs)/health');
            }}
          />

          <View style={styles.divider} />

          <MenuItem
            icon={<ClipboardList size={22} color={colors.primary[600]} />}
            title="예정된 관리"
            description="투약, 예방접종, 검진 일정을 관리해요"
            onPress={() => {
              router.push('/care');
            }}
          />

          <View style={styles.divider} />

          <MenuItem
            icon={<FileText size={22} color={colors.neutral[500]} />}
            title="병원용 리포트"
            description="진료 때 보여줄 기록을 한 장으로 모아요"
            badge="예정"
            disabled
          />
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="body2" color="secondary" style={styles.sectionTitle}>
          반려동물 이해하기
        </AppText>

        <View style={styles.card}>
          <MenuItem
            icon={<Brain size={22} color={colors.neutral[500]} />}
            title="성격 유형 검사"
            badge="예정"
            disabled
          />
          <MenuItem
            icon={<Sparkles size={22} color={colors.neutral[500]} />}
            title="행동 특성 리포트"
            badge="예정"
            disabled
          />
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="body2" color="secondary" style={styles.sectionTitle}>
          함께 관리하기
        </AppText>

        <View style={styles.card}>
          <MenuItem
            icon={<Users size={22} color={colors.neutral[500]} />}
            title="가족 공유"
            description="가족과 함께 기록하고 일정을 챙겨요"
            badge="예정"
            disabled
          />
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="body2" color="secondary" style={styles.sectionTitle}>
          서비스
        </AppText>

        <View style={styles.card}>
          <MenuItem
            icon={<Stethoscope size={22} color={colors.neutral[500]} />}
            title="동물병원"
            description="가까운 동물병원을 찾아봐요"
            badge="예정"
            disabled
          />

          <View style={styles.divider} />

          <MenuItem
            icon={<ShieldPlus size={22} color={colors.neutral[500]} />}
            title="펫 보험"
            description="반려동물 보험 정보를 확인해요"
            badge="예정"
            disabled
          />
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="body2" color="secondary" style={styles.sectionTitle}>
          계정
        </AppText>

        <View style={styles.card}>
          <MenuItem
            icon={<LogOut size={22} color={colors.neutral[600]} />}
            iconStyle={styles.menuIconNeutral}
            title="로그아웃"
            onPress={confirmLogout}
          />

          <View style={styles.divider} />

          <MenuItem
            icon={<UserX size={22} color={colors.neutral[600]} />}
            iconStyle={styles.menuIconNeutral}
            title="회원 탈퇴"
            description="계정과 모든 기록을 삭제해요"
            onPress={confirmDeleteAccount}
          />
        </View>
      </View>
    </ScrollView>
  );
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

  header: {
    marginBottom: 32,
  },

  description: {
    marginTop: 8,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 28,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
  },

  profileAvatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: colors.primary[100],
  },

  profileAvatarImage: {
    width: 60,
    height: 60,
  },

  profileText: {
    flex: 1,
    marginLeft: 14,
  },

  profileMeta: {
    marginTop: 4,
  },

  profileChevron: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.neutral[0],
  },

  section: {
    marginBottom: 28,
  },

  sectionTitle: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  card: {
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },

  menuItem: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  menuItemPressed: {
    opacity: 0.6,
  },

  menuIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primary[50],
  },

  menuIconNeutral: {
    backgroundColor: colors.neutral[100],
  },

  menuText: {
    flex: 1,
    marginLeft: 14,
  },

  menuDescription: {
    marginTop: 4,
  },

  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.neutral[100],
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
    backgroundColor: colors.neutral[200],
  },
});
