import {
  Activity,
  Hospital,
  type LucideIcon,
  Pill,
  Scale,
  ShieldCheck,
} from 'lucide-react-native';

import { getRecordTone } from '@/constants/tones';
import type { HealthRecordType } from '@/types/health';

const ICONS: Record<HealthRecordType, LucideIcon> = {
  WEIGHT: Scale,
  SYMPTOM: Activity,
  MEDICATION: Pill,
  VACCINATION: ShieldCheck,
  VET_VISIT: Hospital,
};

type Props = {
  type: HealthRecordType;
  size?: number;
};

export function HealthRecordIcon({ type, size = 18 }: Props) {
  const Icon = ICONS[type];

  return <Icon size={size} color={getRecordTone(type).icon} />;
}
