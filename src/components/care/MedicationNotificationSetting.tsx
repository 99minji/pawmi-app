import { Alert, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import { requestNotificationPermission } from '@/utils/notification';

type Props = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
};

/**
 * 투약 알림 ON/OFF
 *
 * 투약은 등록한 각 투약 시간에 알림을 보내므로 별도 시간 선택이 없다.
 */
export function MedicationNotificationSetting({
  enabled,
  onEnabledChange,
}: Props) {
  // 알림을 켜는 순간 권한을 확인하고, 거부되면 OFF로 둔다.
  const handleChange = async (nextEnabled: boolean) => {
    if (!nextEnabled) {
      onEnabledChange(false);
      return;
    }

    const granted = await requestNotificationPermission();

    onEnabledChange(granted);

    if (!granted) {
      Alert.alert(
        '알림 권한이 필요해요',
        '기기 설정에서 알림 권한을 허용해주세요.',
      );
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.text}>
        <AppText variant="body1">투약 시간마다 알림</AppText>

        <AppText variant="body2" color="secondary">
          등록한 각 투약 시간에 알림을 보내드려요.
        </AppText>
      </View>

      <Switch value={enabled} onValueChange={handleChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 16,
    backgroundColor: colors.neutral[0],
  },

  text: {
    flex: 1,
    gap: 4,
  },
});
