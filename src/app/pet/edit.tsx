import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/common/AppText';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';
import { shadows } from '@/constants/theme';
import {
  AVATAR_BREED_LABELS,
  AVATAR_BREED_OPTIONS,
  getPetAvatar,
  petAvatars,
} from '@/constants/petAvatars';
import { updatePetById } from '@/services/pet';
import { usePetStore } from '@/stores/usePetStore';
import type { AvatarBreed, Gender, Pet } from '@/types/pet';
import { parseDateString, toDateString } from '@/utils/date';

export default function PetEditScreen() {
  const pet = usePetStore((state) => state.pet);

  if (!pet) {
    return null;
  }

  return <PetEditForm pet={pet} />;
}

function PetEditForm({ pet }: { pet: Pet }) {
  const setPet = usePetStore((state) => state.setPet);

  const [name, setName] = useState(pet.name);
  const [gender, setGender] = useState<Gender>(pet.gender);

  const [birthDate, setBirthDate] = useState<Date | null>(
    pet.birthDate ? parseDateString(pet.birthDate) : null,
  );

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [avatarBreed, setAvatarBreed] = useState<AvatarBreed>(
    pet.avatarBreed ?? 'POMERANIAN',
  );

  const [saving, setSaving] = useState(false);

  const isValid = name.trim().length > 0;

  const currentAvatar = getPetAvatar(avatarBreed);

  const handleSave = async () => {
    if (!pet || !isValid || saving) {
      return;
    }

    setSaving(true);

    try {
      const updatedPet = await updatePetById(pet.id, {
        name: name.trim(),

        breed: AVATAR_BREED_LABELS[avatarBreed],

        gender,

        avatarBreed,

        ...(birthDate
          ? {
              birthDate: toDateString(birthDate),
              // 정확한 생일을 저장하면 추정 나이는 DB에서 지운다. (undefined는 업데이트에서 제외됨)
              estimatedAge: null,
            }
          : {}),
      });

      setPet(updatedPet);

      router.back();
    } catch (error) {
      console.log('UPDATE PET ERROR:', error);

      Alert.alert('저장하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="heading1">프로필을 수정해볼까요?</AppText>

        <AppText variant="body1" color="secondary" style={styles.description}>
          반려동물 정보를 언제든 바꿀 수 있어요.
        </AppText>

        <View style={styles.avatarSection}>
          <Image
            source={currentAvatar.idle}
            style={styles.currentAvatar}
            resizeMode="contain"
          />

          <AppText variant="body2" color="secondary">
            현재 아바타
          </AppText>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <AppText variant="label">이름</AppText>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="이름을 입력해주세요"
              placeholderTextColor={colors.neutral[400]}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <AppText variant="label">생일</AppText>

            <Pressable
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <AppText
                variant="body1"
                color={birthDate ? 'primary' : 'tertiary'}
              >
                {birthDate
                  ? birthDate.toLocaleDateString('ko-KR')
                  : '생일을 선택해주세요'}
              </AppText>
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={birthDate ?? new Date()}
                mode="date"
                presentation="dialog"
                maximumDate={new Date()}
                onValueChange={(_, selectedDate) => {
                  setShowDatePicker(false);
                  setBirthDate(selectedDate);
                }}
                onDismiss={() => {
                  setShowDatePicker(false);
                }}
              />
            )}
          </View>

          <View style={styles.field}>
            <AppText variant="label">성별</AppText>

            <View style={styles.optionRow}>
              {[
                {
                  label: '남아',
                  value: 'MALE',
                },
                {
                  label: '여아',
                  value: 'FEMALE',
                },
              ].map((item) => {
                const selected = gender === item.value;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setGender(item.value as Gender)}
                    style={[styles.option, selected && styles.optionSelected]}
                  >
                    <AppText
                      variant="body2"
                      color={selected ? 'brand' : 'primary'}
                    >
                      {item.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <AppText variant="label">품종</AppText>

            <View style={styles.avatarOptionRow}>
              {AVATAR_BREED_OPTIONS.map((breed) => (
                <Pressable
                  key={breed}
                  style={[
                    styles.avatarOption,
                    avatarBreed === breed && styles.avatarOptionSelected,
                  ]}
                  onPress={() => setAvatarBreed(breed)}
                >
                  <Image
                    source={petAvatars[breed].idle}
                    style={styles.avatarOptionImage}
                    resizeMode="contain"
                  />

                  <AppText variant="body2">
                    {AVATAR_BREED_LABELS[breed]}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={saving ? '저장 중...' : '저장하기'}
          disabled={!isValid || saving}
          onPress={handleSave}
        />
      </View>
    </KeyboardAvoidingView>
  );
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

  description: {
    marginTop: 8,
  },

  avatarSection: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
  },

  currentAvatar: {
    width: 190,
    height: 190,
  },

  form: {
    marginTop: 32,
    gap: 28,
  },

  field: {
    gap: 10,
  },

  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border.input,
    borderRadius: 16,
    backgroundColor: colors.surface.card,
    paddingHorizontal: 16,
    justifyContent: 'center',

    fontFamily: 'Pretendard-Regular',
    fontSize: 16,
    color: colors.neutral[900],
  },

  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },

  option: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.input,
    backgroundColor: colors.surface.card,
  },

  optionSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },

  avatarOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  avatarOption: {
    width: 140,
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.soft,
    backgroundColor: colors.surface.card,
    ...shadows.soft,
  },

  avatarOptionImage: {
    width: 100,
    height: 100,
  },

  avatarOptionSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
