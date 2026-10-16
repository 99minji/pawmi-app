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
import { forwardRef, useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import { parseHealthRecord } from '@/services/ai';

type QuickRecordItem = {
  label: string;
  icon: React.ReactNode;
  route?: string;
};

export const QuickRecordSheet = forwardRef<BottomSheet, object>(
  function QuickRecordSheet(_, ref) {
    const snapPoints = useMemo(() => ['68%'], []);

    const [aiInput, setAiInput] = useState('');
    const [parsing, setParsing] = useState(false);

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

    const handleParseHealthRecord = async () => {
      const input = aiInput.trim();

      if (!input || parsing) {
        return;
      }

      setParsing(true);

      try {
        const parsed = await parseHealthRecord(input);

        if (typeof ref !== 'function' && ref?.current) {
          ref.current.close();
        }

        setAiInput('');

        switch (parsed.type) {
          case 'SYMPTOM':
            router.push({
              pathname: '/record/symptom',
              params: {
                ai: '1',
                occurredAt: parsed.occurredAt ?? '',
                symptom: parsed.symptom ?? '',
                memo: parsed.memo ?? '',
              },
            });

            break;

          case 'MEDICATION':
            router.push({
              pathname: '/record/medication',
              params: {
                ai: '1',
                occurredAt: parsed.occurredAt ?? '',
                medicationName: parsed.medicationName ?? '',
                dosageText: parsed.dosageText ?? '',
                memo: parsed.memo ?? '',
              },
            });

            break;

          case 'VET_VISIT':
            router.push({
              pathname: '/record/vet-visit',
              params: {
                ai: '1',
                occurredAt: parsed.occurredAt ?? '',
                clinicName: parsed.clinicName ?? '',
                visitReason: parsed.visitReason ?? '',
                memo: parsed.memo ?? '',
              },
            });

            break;
        }
      } catch (error) {
        console.log('PARSE HEALTH RECORD ERROR:', error);

        Alert.alert(
          '기록을 이해하지 못했어요',
          '조금 더 구체적으로 다시 적어주세요.',
        );
      } finally {
        setParsing(false);
      }
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

          <View style={styles.aiSection}>
            <AppText variant="body1">포우미에게 말해보세요</AppText>

            <AppText
              variant="body2"
              color="secondary"
              style={styles.aiDescription}
            >
              증상, 투약, 병원 방문을 자연스럽게 적으면 기록 폼을 자동으로
              채워드려요.
            </AppText>

            <TextInput
              value={aiInput}
              onChangeText={setAiInput}
              placeholder="예: 오늘 새벽에 두 번 토했어"
              placeholderTextColor={colors.neutral[400]}
              multiline
              style={styles.aiInput}
            />

            <Pressable
              disabled={!aiInput.trim() || parsing}
              style={[
                styles.aiButton,
                (!aiInput.trim() || parsing) && styles.aiButtonDisabled,
              ]}
              onPress={handleParseHealthRecord}
            >
              <AppText variant="body1" color="inverse">
                {parsing ? '이해하는 중...' : '기록 자동 입력'}
              </AppText>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <AppText variant="body2" color="secondary">
            직접 선택하기
          </AppText>

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

  aiSection: {
    marginTop: 20,
    gap: 10,
  },

  aiDescription: {
    lineHeight: 20,
  },

  aiInput: {
    minHeight: 92,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    backgroundColor: colors.neutral[50],
    fontFamily: 'Pretendard-Regular',
    fontSize: 16,
    color: colors.neutral[900],
    textAlignVertical: 'top',
  },

  aiButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary[600],
  },

  aiButtonDisabled: {
    opacity: 0.5,
  },

  divider: {
    height: 1,
    marginVertical: 20,
    backgroundColor: colors.neutral[200],
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
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
