import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import {
  HeartPulse,
  Hospital,
  Pill,
  Scale,
  ShieldCheck,
} from 'lucide-react-native';
import { forwardRef, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';

type QuickRecordItem = {
  label: string;
  icon: React.ReactNode;
  route?: string;
};

export const QuickRecordSheet = forwardRef<BottomSheet, object>(
  function QuickRecordSheet(_, ref) {
    const snapPoints = useMemo(() => ['42%'], []);

    const items: QuickRecordItem[] = [
      {
        label: '체중',
        icon: <Scale size={22} color={colors.primary[700]} />,
        route: '/record/weight',
      },
      {
        label: '증상',
        icon: <HeartPulse size={22} color={colors.primary[700]} />,
        route: '/record/symptom',
      },
      {
        label: '투약',
        icon: <Pill size={22} color={colors.primary[700]} />,
        route: '/record/medication',
      },
      {
        label: '예방',
        icon: <ShieldCheck size={22} color={colors.primary[700]} />,
        route: '/record/vaccination',
      },
      {
        label: '병원',
        icon: <Hospital size={22} color={colors.primary[700]} />,
        route: '/record/vet-visit',
      },
    ];

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.35}
        />
      ),
      [],
    );

    const handlePress = (route?: string) => {
      if (!route) {
        return;
      }

      if (typeof ref !== 'function' && ref?.current) {
        ref.current.close();
      }

      router.push(route as never);
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheet}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetView style={styles.content}>
          <AppText variant="heading2">무엇을 기록할까요?</AppText>

          <View style={styles.grid}>
            {items.map((item) => (
              <Pressable
                key={item.label}
                style={styles.item}
                onPress={() => handlePress(item.route)}
              >
                <View style={styles.icon}>{item.icon}</View>

                <AppText variant="body2">{item.label}</AppText>
              </Pressable>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.neutral[0],
    borderRadius: 24,
  },

  handle: {
    backgroundColor: colors.neutral[300],
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },

  item: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral[50],
  },

  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
    marginBottom: 8,
  },
});
