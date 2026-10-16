import { Tabs } from 'expo-router';
import { HeartPulse, Home, LayoutGrid } from 'lucide-react-native';

import { colors } from '@/constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          height: 82,
          paddingTop: 8,
          paddingBottom: 18,
          borderTopColor: colors.neutral[200],
          backgroundColor: colors.neutral[0],
        },
        tabBarLabelStyle: {
          fontFamily: 'Pretendard-Medium',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '오늘',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} strokeWidth={2} />
          ),
        }}
      />

      <Tabs.Screen
        name="health"
        options={{
          title: '건강',
          tabBarIcon: ({ color, size }) => (
            <HeartPulse color={color} size={size} strokeWidth={2} />
          ),
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: '전체 메뉴',
          tabBarIcon: ({ color, size }) => (
            <LayoutGrid color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
