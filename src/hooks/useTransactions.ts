import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { TransactionWithCategory, TxType } from '@/lib/types';

interface CreateInput {
  type: TxType;
  amount: number;
  category_id: string | null;
  note?: string | null;
  occurred_at?: string;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(id, name, icon, color)')
      .order('occurred_at', { ascending: false })
      .limit(500);
    if (error) setError(error.message);
    else setTransactions((data ?? []) as unknown as TransactionWithCategory[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: CreateInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return { error: 'Tidak ada sesi pengguna' };
      const { error } = await supabase.from('transactions').insert({
        user_id: userId,
        type: input.type,
        amount: input.amount,
        category_id: input.category_id,
        note: input.note ?? null,
        occurred_at: input.occurred_at ?? new Date().toISOString(),
      });
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  return { transactions, loading, error, refresh, create, remove };
}
