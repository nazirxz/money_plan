import { useMemo } from 'react';
import type { TransactionWithCategory, TxType } from '@/lib/types';

export interface BreakdownEntry {
  categoryId: string | null;
  name: string;
  icon: string | null;
  color: string;
  total: number;
  percent: number;
}

interface Options {
  type: TxType;
  start?: Date | null;
  end?: Date | null;
}

const FALLBACK_COLOR = '#94a3b8';
const FALLBACK_NAME = 'Tanpa kategori';

export function useCategoryBreakdown(
  transactions: TransactionWithCategory[],
  { type, start, end }: Options
): { entries: BreakdownEntry[]; total: number } {
  return useMemo(() => {
    const buckets = new Map<string, BreakdownEntry>();
    let total = 0;

    for (const t of transactions) {
      if (t.type !== type) continue;
      if (start || end) {
        const d = new Date(t.occurred_at);
        if (start && d < start) continue;
        if (end && d > end) continue;
      }
      const amount = Number(t.amount);
      total += amount;
      const key = t.category_id ?? '__none__';
      const existing = buckets.get(key);
      if (existing) {
        existing.total += amount;
      } else {
        buckets.set(key, {
          categoryId: t.category_id,
          name: t.category?.name ?? FALLBACK_NAME,
          icon: t.category?.icon ?? null,
          color: t.category?.color ?? FALLBACK_COLOR,
          total: amount,
          percent: 0,
        });
      }
    }

    const entries = Array.from(buckets.values())
      .map((e) => ({ ...e, percent: total > 0 ? (e.total / total) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);

    return { entries, total };
  }, [transactions, type, start, end]);
}
