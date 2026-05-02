import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Budget } from '@/lib/types';

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('budgets').select('*');
    if (error) setError(error.message);
    else setBudgets((data ?? []) as Budget[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Upsert one budget by category_id. amount <= 0 deletes it.
  const upsert = useCallback(
    async (categoryId: string, amount: number) => {
      if (amount <= 0) {
        const { error } = await supabase
          .from('budgets')
          .delete()
          .eq('category_id', categoryId);
        if (error) return { error: error.message };
        await refresh();
        return { error: null };
      }
      const { error } = await supabase
        .from('budgets')
        .upsert(
          { category_id: categoryId, amount, updated_at: new Date().toISOString() },
          { onConflict: 'category_id' }
        );
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  // Bulk upsert/delete. amounts is a Map<categoryId, amount>. amount <= 0 deletes.
  const upsertMany = useCallback(
    async (amounts: Map<string, number>) => {
      const toDelete: string[] = [];
      const toUpsert: { category_id: string; amount: number; updated_at: string }[] = [];
      const now = new Date().toISOString();
      for (const [categoryId, amount] of amounts) {
        if (amount <= 0) toDelete.push(categoryId);
        else toUpsert.push({ category_id: categoryId, amount, updated_at: now });
      }
      if (toDelete.length > 0) {
        const { error } = await supabase
          .from('budgets')
          .delete()
          .in('category_id', toDelete);
        if (error) return { error: error.message };
      }
      if (toUpsert.length > 0) {
        const { error } = await supabase
          .from('budgets')
          .upsert(toUpsert, { onConflict: 'category_id' });
        if (error) return { error: error.message };
      }
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  return { budgets, loading, error, refresh, upsert, upsertMany };
}
