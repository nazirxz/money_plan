import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getDisplayName } from '@/lib/users';
import type { RecurringRuleWithCategory, RecurringFrequency, TxType } from '@/lib/types';

export interface RecurringRuleInput {
  type: TxType;
  category_id: string;
  amount: number;
  note?: string | null;
  frequency: RecurringFrequency;
  day_of_month?: number | null;
  day_of_week?: number | null;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null;
  active?: boolean;
}

export function useRecurringRules() {
  const [rules, setRules] = useState<RecurringRuleWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recurring_rules')
      .select('*, category:categories(id, name, icon, color)')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setRules((data ?? []) as unknown as RecurringRuleWithCategory[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: RecurringRuleInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return { error: 'Tidak ada sesi pengguna' };
      const { error } = await supabase.from('recurring_rules').insert({
        user_id: user.id,
        creator_name: getDisplayName(user.email),
        type: input.type,
        category_id: input.category_id,
        amount: input.amount,
        note: input.note ?? null,
        frequency: input.frequency,
        day_of_month: input.frequency === 'monthly' ? input.day_of_month ?? null : null,
        day_of_week: input.frequency === 'weekly' ? input.day_of_week ?? null : null,
        start_date: input.start_date,
        end_date: input.end_date ?? null,
        active: input.active ?? true,
      });
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, patch: Partial<RecurringRuleInput>) => {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (patch.type !== undefined) updates.type = patch.type;
      if (patch.category_id !== undefined) updates.category_id = patch.category_id;
      if (patch.amount !== undefined) updates.amount = patch.amount;
      if (patch.note !== undefined) updates.note = patch.note;
      if (patch.frequency !== undefined) {
        updates.frequency = patch.frequency;
        // Reset opposite-axis day to satisfy CHECK constraint.
        if (patch.frequency === 'monthly') updates.day_of_week = null;
        else updates.day_of_month = null;
      }
      if (patch.day_of_month !== undefined) updates.day_of_month = patch.day_of_month;
      if (patch.day_of_week !== undefined) updates.day_of_week = patch.day_of_week;
      if (patch.start_date !== undefined) updates.start_date = patch.start_date;
      if (patch.end_date !== undefined) updates.end_date = patch.end_date;
      if (patch.active !== undefined) updates.active = patch.active;

      const { error } = await supabase
        .from('recurring_rules')
        .update(updates)
        .eq('id', id);
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('recurring_rules').delete().eq('id', id);
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  return { rules, loading, error, refresh, create, update, remove };
}
