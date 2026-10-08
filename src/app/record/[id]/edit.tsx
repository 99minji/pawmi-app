import { useLocalSearchParams } from 'expo-router';

import HealthRecordEditForm from '@/components/record/HealthRecordEditForm';
import { useHealthStore } from '@/stores/useHealthStore';

export default function HealthRecordEditScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const record = useHealthStore((state) =>
    state.records.find((item) => item.id === id),
  );

  if (!record) {
    return null;
  }

  return <HealthRecordEditForm key={record.id} record={record} />;
}
