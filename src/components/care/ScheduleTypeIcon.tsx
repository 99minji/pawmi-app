import { HeartPulse, Hospital, Pill, ShieldCheck } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import type { CareScheduleType } from '@/types/care';

export function ScheduleTypeIcon({ type }: { type: CareScheduleType }) {
  switch (type) {
    case 'VACCINATION':
      return <ShieldCheck size={20} color={colors.primary[700]} />;

    case 'MEDICATION':
      return <Pill size={20} color={colors.primary[700]} />;

    case 'HEARTWORM':
      return <HeartPulse size={20} color={colors.primary[700]} />;

    case 'CHECKUP':
      return <Hospital size={20} color={colors.primary[700]} />;
  }
}
