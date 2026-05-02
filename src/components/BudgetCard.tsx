import { useMemo } from 'react';
import { AlertTriangle, Settings2, Wallet } from 'lucide-react';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { getIcon } from '@/lib/icons';
import { classNames, formatIDR, formatIDRCompact } from '@/lib/utils';
import type { TransactionWithCategory } from '@/lib/types';

interface Props {
  transactions: TransactionWithCategory[];
  start: Date;
  end: Date;
  onEdit: () => void;
}

interface BudgetRow {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  limit: number;
  spent: number;
  percent: number;
  status: 'safe' | 'warn' | 'over';
}

function statusOf(percent: number): BudgetRow['status'] {
  if (percent >= 100) return 'over';
  if (percent >= 80) return 'warn';
  return 'safe';
}

export default function BudgetCard({ transactions, start, end, onEdit }: Props) {
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { categories } = useCategories();

  const rows = useMemo<BudgetRow[]>(() => {
    if (budgets.length === 0) return [];
    const byCat = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== 'expense' || !t.category_id) continue;
      const d = new Date(t.occurred_at);
      if (d < start || d > end) continue;
      byCat.set(t.category_id, (byCat.get(t.category_id) ?? 0) + Number(t.amount));
    }
    const catMap = new Map(categories.map((c) => [c.id, c]));
    return budgets
      .map((b) => {
        const cat = catMap.get(b.category_id);
        const limit = Number(b.amount);
        const spent = byCat.get(b.category_id) ?? 0;
        const percent = limit > 0 ? (spent / limit) * 100 : 0;
        return {
          categoryId: b.category_id,
          name: cat?.name ?? 'Kategori dihapus',
          icon: cat?.icon ?? 'tag',
          color: cat?.color ?? '#94a3b8',
          limit,
          spent,
          percent,
          status: statusOf(percent),
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [budgets, categories, transactions, start, end]);

  const totals = useMemo(() => {
    let limit = 0;
    let spent = 0;
    for (const r of rows) {
      limit += r.limit;
      spent += r.spent;
    }
    return { limit, spent, remaining: limit - spent };
  }, [rows]);

  const overCount = rows.filter((r) => r.status === 'over').length;
  const warnCount = rows.filter((r) => r.status === 'warn').length;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-900">Anggaran bulan ini</h2>
        </div>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Atur
        </button>
      </div>

      {budgetsLoading ? (
        <p className="mt-4 text-center text-sm text-zinc-500">Memuat...</p>
      ) : rows.length === 0 ? (
        <div className="mt-3 rounded-xl bg-zinc-50 p-4 text-center">
          <p className="text-sm text-zinc-600">Belum ada anggaran ditetapkan.</p>
          <p className="mt-1 text-xs text-zinc-500">
            Tetapkan limit per kategori untuk kontrol pengeluaran.
          </p>
          <button
            onClick={onEdit}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Tetapkan anggaran
          </button>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-zinc-50 p-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                Terpakai
              </p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-zinc-900">
                {formatIDRCompact(totals.spent)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                Limit
              </p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-zinc-900">
                {formatIDRCompact(totals.limit)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                Sisa
              </p>
              <p
                className={classNames(
                  'mt-0.5 text-sm font-bold tabular-nums',
                  totals.remaining < 0 ? 'text-rose-600' : 'text-brand-700'
                )}
              >
                {formatIDRCompact(totals.remaining)}
              </p>
            </div>
          </div>

          {(overCount > 0 || warnCount > 0) && (
            <div
              className={classNames(
                'mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium',
                overCount > 0
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-amber-50 text-amber-700'
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {overCount > 0 && (
                <span>
                  {overCount} kategori melewati limit
                  {warnCount > 0 ? `, ${warnCount} mendekati` : ''}
                </span>
              )}
              {overCount === 0 && warnCount > 0 && (
                <span>{warnCount} kategori mendekati limit (≥80%)</span>
              )}
            </div>
          )}

          <ul className="mt-3 space-y-3">
            {rows.map((r) => {
              const Icon = getIcon(r.icon);
              const barColor =
                r.status === 'over'
                  ? '#e11d48'
                  : r.status === 'warn'
                  ? '#f59e0b'
                  : r.color;
              return (
                <li key={r.categoryId}>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: r.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-zinc-800">
                          {r.name}
                        </p>
                        <p
                          className={classNames(
                            'shrink-0 text-xs font-semibold tabular-nums',
                            r.status === 'over'
                              ? 'text-rose-600'
                              : r.status === 'warn'
                              ? 'text-amber-700'
                              : 'text-zinc-700'
                          )}
                        >
                          {formatIDR(r.spent)}
                          <span className="font-normal text-zinc-400">
                            {' '}
                            / {formatIDRCompact(r.limit)}
                          </span>
                        </p>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(r.percent, 100)}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                        <span
                          className={classNames(
                            'shrink-0 text-[11px] font-medium tabular-nums',
                            r.status === 'over'
                              ? 'text-rose-600'
                              : r.status === 'warn'
                              ? 'text-amber-700'
                              : 'text-zinc-500'
                          )}
                        >
                          {r.percent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
