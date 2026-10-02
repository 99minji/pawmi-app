import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { Redirect } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {
  const isCompleted = useOnboardingStore((state) => state.isCompleted);

  if (isCompleted) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding/name" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '600',
  },

  description: {
    marginTop: 12,
    fontSize: 16,
  },
});
