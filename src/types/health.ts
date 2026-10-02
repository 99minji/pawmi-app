export type HealthRecordType =
  | 'WEIGHT'
  | 'SYMPTOM'
  | 'MEDICATION'
  | 'VACCINATION'
  | 'VET_VISIT';

type BaseHealthRecord = {
  id: string;
  petId: string;
  title: string;
  occurredAt: string;
  createdAt: string;
  memo?: string;
};

export type WeightRecord = BaseHealthRecord & {
  type: 'WEIGHT';
  weightKg: number;
};

export type SymptomRecord = BaseHealthRecord & {
  type: 'SYMPTOM';
  symptom: string;
};

export type HealthRecord = WeightRecord | SymptomRecord;
