import { HeartPulse, Hospital, Pill, ShieldCheck } from 'lucide-react-native';

import { getScheduleTone } from '@/constants/tones';
import type { CareScheduleType } from '@/types/care';

type Props = {
  type: CareScheduleType;
  // 지정하지 않으면 일정 종류의 톤 색을 쓴다.
  color?: string;
};

export function ScheduleTypeIcon({ type, color }: Props) {
  const iconColor = color ?? getScheduleTone(type).icon;

  switch (type) {
    case 'VACCINATION':
      return <ShieldCheck size={20} color={iconColor} />;

    case 'MEDICATION':
      return <Pill size={20} color={iconColor} />;

    case 'HEARTWORM':
      return <HeartPulse size={20} color={iconColor} />;

    case 'CHECKUP':
      return <Hospital size={20} color={iconColor} />;
  }
}
