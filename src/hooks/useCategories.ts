import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Category, TxType } from '@/lib/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('type', { ascending: true })
      .order('name', { ascending: true });
    if (error) setError(error.message);
    else setCategories((data ?? []) as Category[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: { name: string; type: TxType; icon: string; color: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return { error: 'Tidak ada sesi pengguna' };
      const { error } = await supabase.from('categories').insert({
        user_id: userId,
        ...input,
      });
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, patch: Partial<Pick<Category, 'name' | 'icon' | 'color'>>) => {
      const { error } = await supabase.from('categories').update(patch).eq('id', id);
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  return { categories, loading, error, refresh, create, update, remove };
}
