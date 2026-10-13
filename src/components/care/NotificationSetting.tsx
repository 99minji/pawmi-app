import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { Bell, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Switch, View } from 'react-native';

import { SettingCard } from '@/components/care/SettingCard';
import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import { formatKoreanTime, parseTimeString, toTimeString } from '@/utils/date';
import { requestNotificationPermission } from '@/utils/notification';

type Props = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  time: string;
  onTimeChange: (time: string) => void;
};

/**
 * 관리 알림 ON/OFF + 알림 시간 선택
 */
export function NotificationSetting({
  enabled,
  onEnabledChange,
  time,
  onTimeChange,
}: Props) {
  const [showTimePicker, setShowTimePicker] = useState(false);

  // 알림을 켜는 순간 권한을 확인하고, 거부되면 OFF로 둔다.
  const handleEnabledChange = async (nextEnabled: boolean) => {
    if (!nextEnabled) {
      onEnabledChange(false);

      return;
    }

    const granted = await requestNotificationPermission();

    if (!granted) {
      Alert.alert(
        '알림 권한이 필요해요',
        '기기 설정에서 알림 권한을 허용해주세요.',
      );

      return;
    }

    onEnabledChange(true);
  };

  return (
    <View>
      <SettingCard
        icon={Bell}
        title="관리 알림"
        description="예정일에 알림을 보내드려요."
        right={
          <Switch
            value={enabled}
            onValueChange={handleEnabledChange}
            trackColor={{
              false: colors.neutral[300],
              true: colors.primary[300],
            }}
            thumbColor={enabled ? colors.primary[700] : colors.neutral[0]}
          />
        }
      />

      {enabled && (
        <SettingCard
          icon={Clock}
          title="알림 시간"
          description={`예정일 ${formatKoreanTime(time)}`}
          right={
            <AppText variant="body1" color="brand">
              {formatKoreanTime(time)}
            </AppText>
          }
          onPress={() => setShowTimePicker(true)}
        />
      )}

      {enabled && showTimePicker && (
        <DateTimePicker
          value={parseTimeString(time)}
          mode="time"
          presentation="dialog"
          is24Hour
          onValueChange={(_, selectedDate) => {
            setShowTimePicker(false);
            onTimeChange(toTimeString(selectedDate));
          }}
          onDismiss={() => {
            setShowTimePicker(false);
          }}
        />
      )}
    </View>
  );
}
