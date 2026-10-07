import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { Redirect } from 'expo-router';

export default function HomeScreen() {
  const isCompleted = useOnboardingStore((state) => state.isCompleted);

  if (isCompleted) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding/name" />;
}
