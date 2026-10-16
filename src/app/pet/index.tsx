import { router } from 'expo-router';
import { ChevronLeft, Pencil } from 'lucide-react-native';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import { shadows } from '@/constants/theme';
import { getPetAvatar } from '@/constants/petAvatars';
import { usePetStore } from '@/stores/usePetStore';
import { formatBreed, formatGender, formatPetAge } from '@/utils/pet';

export default function PetScreen() {
  const pet = usePetStore((state) => state.pet);

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <ChevronLeft size={24} color={colors.neutral[800]} />
          </Pressable>

          <AppText variant="heading1">반려동물</AppText>
        </View>

        <Pressable
          style={styles.editButton}
          onPress={() => router.push('/pet/edit')}
        >
          <Pencil size={18} color={colors.primary[600]} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
    backgroundColor: colors.background.primary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  backButton: {
    width: 32,
    height: 40,
    justifyContent: 'center',
    marginLeft: -6,
  },

  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.card,
    ...shadows.soft,
  },

  hero: {
    position: 'relative',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: colors.accent.sageLight,
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
    backgroundColor: colors.accent.peachLight,
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

  infoCard: {
    backgroundColor: colors.surface.card,
    borderRadius: 24,
    paddingHorizontal: 16,
    ...shadows.card,
  },

  infoRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  divider: {
    height: 1,
    backgroundColor: colors.border.soft,
  },
});
