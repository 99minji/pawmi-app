import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/common/AppText';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const isValid = email.trim().length > 0 && password.length >= 6;

  const handleLogin = async () => {
    if (!isValid || loading) {
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('로그인하지 못했어요', getAuthErrorMessage(error.message));

      return;
    }

    router.replace('/');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View>
          <AppText variant="heading1">다시 만나서 반가워요</AppText>

          <AppText variant="body1" color="secondary" style={styles.description}>
            포우미에 로그인하고 반려동물의 기록을 이어서 관리해보세요.
          </AppText>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <AppText variant="label">이메일</AppText>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <AppText variant="label">비밀번호</AppText>

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호"
              placeholderTextColor={colors.neutral[400]}
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
            />
          </View>
        </View>

        <PrimaryButton
          label={loading ? '로그인 중...' : '로그인하기'}
          disabled={!isValid || loading}
          onPress={handleLogin}
        />

        <View style={styles.signupRow}>
          <AppText variant="body2" color="secondary">
            아직 계정이 없나요?
          </AppText>

          <Pressable onPress={() => router.push('/auth/signup')}>
            <AppText variant="body2" color="brand">
              회원가입
            </AppText>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function getAuthErrorMessage(message: string) {
  if (message.includes('Invalid login credentials')) {
    return '이메일 또는 비밀번호를 확인해주세요.';
  }

  if (message.includes('Email not confirmed')) {
    return '이메일 인증을 먼저 완료해주세요.';
  }

  return '잠시 후 다시 시도해주세요.';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  content: {
    flex: 1,
    justifyContent: 'center',

    paddingHorizontal: 20,
  },

  description: {
    marginTop: 10,
    lineHeight: 24,
  },

  form: {
    marginTop: 40,
    marginBottom: 24,
    gap: 22,
  },

  field: {
    gap: 8,
  },

  input: {
    minHeight: 56,

    paddingHorizontal: 16,

    borderRadius: 14,

    borderWidth: 1,
    borderColor: colors.neutral[200],

    backgroundColor: colors.neutral[0],

    fontFamily: 'Pretendard-Regular',

    fontSize: 16,

    color: colors.neutral[900],
  },

  signupRow: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    gap: 6,

    marginTop: 20,
  },
});
