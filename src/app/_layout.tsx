import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { requestNotificationPermission } from '@/utils/notification';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('../../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../../assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('../../assets/fonts/Pretendard-Bold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

/**
 * 로그인 상태에 따라 접근 가능한 화면을 나눈다.
 *
 * 로그아웃으로 session이 사라지면 보호된 화면에서 index로 자동 이동하고,
 * index가 로그인 화면으로 보낸다.
 */
function RootNavigator() {
  const { session } = useAuth();

  const isLoggedIn = !!session;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />

      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/signup" />
      </Stack.Protected>

      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="care/create" />
        <Stack.Screen name="care/[id]" />
        <Stack.Screen name="pet/edit" />
        <Stack.Screen name="record/[id]" />
        <Stack.Screen name="record/medication" />
        <Stack.Screen name="record/symptom" />
        <Stack.Screen name="record/vaccination" />
        <Stack.Screen name="record/vet-visit" />
        <Stack.Screen name="record/weight" />
      </Stack.Protected>
    </Stack>
  );
}
