import { supabase } from '@/lib/supabase';

export async function deleteAccount() {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
  });

  if (error) {
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error ?? '회원 탈퇴에 실패했어요.');
  }

  return true;
}
