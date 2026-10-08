import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { Card } from '@/components/common/Card';
import { colors } from '@/constants/colors';

type Props = {
  title: string;
  description: string;
  icon?: LucideIcon;
  right?: ReactNode;
  onPress?: () => void;
};

/**
 * 아이콘 · 제목 · 설명 · 우측 요소로 구성된 설정 카드
 */
export function SettingCard({
  title,
  description,
  icon: Icon,
  right,
  onPress,
}: Props) {
  const content = (
    <Card style={styles.card}>
      <View style={styles.left}>
        {Icon && (
          <View style={styles.icon}>
            <Icon size={19} color={colors.primary[700]} />
          </View>
        )}

        <View style={styles.text}>
          <AppText variant="body1">{title}</AppText>

          <AppText variant="body2" color="secondary" style={styles.description}>
            {description}
          </AppText>
        </View>
      </View>

      {right}
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  text: {
    flex: 1,
  },

  description: {
    marginTop: 4,
  },
});
