import { supabase } from '@/lib/supabase';

import type { ParsedCareSchedule, ParsedHealthRecord } from '@/types/ai';

type ParseCareScheduleInput = {
  text: string;
  today: string;
  timezone: string;
};

export async function parseCareSchedule(
  input: ParseCareScheduleInput,
): Promise<ParsedCareSchedule> {
  const { data, error } = await supabase.functions.invoke(
    'parse-care-schedule',
    {
      body: input,
    },
  );

  if (error) {
    console.error('PARSE CARE SCHEDULE ERROR:', error);

    throw new Error('일정을 분석하지 못했어요.');
  }

  if (!data) {
    throw new Error('분석 결과가 없어요.');
  }

  return data as ParsedCareSchedule;
}

export async function parseHealthRecord(
  input: string,
): Promise<ParsedHealthRecord> {
  const { data, error } = await supabase.functions.invoke(
    'parse-health-record',
    {
      body: {
        input,
      },
    },
  );

  if (error) {
    throw error;
  }

  if (!data?.result) {
    throw new Error('건강 기록을 해석하지 못했어요.');
  }

  return data.result as ParsedHealthRecord;
}
