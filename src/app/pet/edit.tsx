import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
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
import { AnimatedPetAvatar } from '@/components/pet/AnimatedPetAvatar';
import { colors } from '@/constants/colors';
import { petAvatars } from '@/constants/petAvatars';
import { usePetStore } from '@/stores/usePetStore';
import type { AvatarBreed, Gender } from '@/types/pet';

export default function PetEditScreen() {
  const pet = usePetStore((state) => state.pet);
  const updatePet = usePetStore((state) => state.updatePet);

  if (!pet) {
    return null;
  }

  const [name, setName] = useState(pet.name);
  const [breed, setBreed] = useState(pet.breed ?? '');
  const [gender, setGender] = useState<Gender>(pet.gender);

  const [birthDate, setBirthDate] = useState<Date | null>(
    pet.birthDate ? new Date(pet.birthDate) : null,
  );

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [avatarBreed, setAvatarBreed] = useState<AvatarBreed>(
    pet.avatarBreed ?? 'POMERANIAN',
  );

  const isValid = name.trim().length > 0;

  const toDateString = (date: Date) => {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const handleSave = () => {
    if (!isValid) return;

    updatePet({
      name: name.trim(),

      breed: breed.trim() || undefined,

      gender,

      avatarBreed,

      ...(birthDate
        ? {
            birthDate: toDateString(birthDate),

            estimatedAge: undefined,
          }
        : {}),
    });

    router.back();
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
          <AnimatedPetAvatar
            size={190}
            source={petAvatars.POMERANIAN.idleBody}
            tailSource={petAvatars.POMERANIAN.idleTail}
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
            <View style={styles.labelRow}>
              <AppText variant="label">품종</AppText>

              <AppText variant="label" color="tertiary">
                선택
              </AppText>
            </View>

            <TextInput
              value={breed}
              onChangeText={setBreed}
              placeholder="예: 포메라니안"
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
                locale="ko-KR"
                maximumDate={new Date()}
                onChange={(_event, selectedDate) => {
                  setShowDatePicker(false);

                  if (selectedDate) {
                    setBirthDate(selectedDate);
                  }
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
            <AppText variant="label">아바타</AppText>

            <Pressable
              style={[
                styles.avatarOption,
                avatarBreed === 'POMERANIAN' && styles.avatarOptionSelected,
              ]}
              onPress={() => setAvatarBreed('POMERANIAN')}
            >
              <AnimatedPetAvatar
                size={100}
                source={petAvatars.POMERANIAN.idleBody}
                tailSource={petAvatars.POMERANIAN.idleTail}
              />

              <AppText variant="body2">포메라니안</AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="저장하기"
          disabled={!isValid}
          onPress={handleSave}
        />
      </View>
    </KeyboardAvoidingView>
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

  form: {
    marginTop: 32,
    gap: 28,
  },

  field: {
    gap: 10,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    backgroundColor: colors.neutral[0],
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },

  optionSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },

  avatarOption: {
    width: 140,
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
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
