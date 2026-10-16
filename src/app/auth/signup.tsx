import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/common/AppText';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

export default function SignupScreen() {
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [loading, setLoading] = useState(false);

  const isPasswordMatch = password === passwordConfirm;

  const isValid =
    email.trim().length > 0 && password.length >= 6 && isPasswordMatch;

  const handleSignup = async () => {
    if (!isValid || loading) {
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      console.log('SIGNUP ERROR:', error);

      Alert.alert('가입하지 못했어요', getSignupErrorMessage(error.message));

      return;
    }
    /**
     * 이메일 인증을 꺼둔 개발 환경이라면
     * 바로 session이 만들어진다.
     */
    if (data.session) {
      router.replace('/');
      return;
    }

    /**
     * 이메일 인증이 켜져있는 경우
     */
    Alert.alert(
      '이메일을 확인해주세요',
      '보내드린 인증 메일을 확인한 뒤 로그인해주세요.',
      [
        {
          text: '확인',
          onPress: () => router.replace('/auth/login'),
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <AppText variant="heading1">포우미를 시작해볼까요?</AppText>

        <AppText variant="body1" color="secondary" style={styles.description}>
          계정을 만들면 반려동물의 건강 기록을 안전하게 보관할 수 있어요.
        </AppText>

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
              placeholder="6자 이상 입력해주세요"
              placeholderTextColor={colors.neutral[400]}
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <AppText variant="label">비밀번호 확인</AppText>

            <TextInput
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder="비밀번호를 다시 입력해주세요"
              placeholderTextColor={colors.neutral[400]}
              secureTextEntry
              autoCapitalize="none"
              style={[
                styles.input,

                passwordConfirm && !isPasswordMatch && styles.inputError,
              ]}
            />

            {passwordConfirm && !isPasswordMatch && (
              <AppText variant="label" style={styles.errorText}>
                비밀번호가 일치하지 않아요.
              </AppText>
            )}
          </View>
        </View>

        <PrimaryButton
          label={loading ? '가입 중...' : '가입하기'}
          disabled={!isValid || loading}
          onPress={handleSignup}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function getSignupErrorMessage(message: string) {
  if (message.includes('already registered')) {
    return '이미 가입된 이메일이에요.';
  }

  return '입력한 정보를 확인해주세요.';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: colors.background.primary,
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

    borderRadius: 16,

    borderWidth: 1,
    borderColor: colors.border.input,

    backgroundColor: colors.surface.card,

    fontFamily: 'Pretendard-Regular',

    fontSize: 16,

    color: colors.neutral[900],
  },

  inputError: {
    borderColor: colors.error[500],
  },

  errorText: {
    color: colors.error[500],
  },
});
