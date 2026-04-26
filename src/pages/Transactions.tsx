import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import TransactionItem from '@/components/TransactionItem';
import { classNames, formatDate, formatIDR } from '@/lib/utils';
import type { TransactionWithCategory, TxType } from '@/lib/types';

type Filter = 'all' | TxType;

export default function Transactions() {
  const { transactions, loading, remove } = useTransactions();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false;
      if (!q) return true;
      const hay = [t.note ?? '', t.category?.name ?? '', t.creator_name ?? '']
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [transactions, filter, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, TransactionWithCategory[]>();
    for (const t of filtered) {
      const key = t.occurred_at.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [filtered]);

  async function handleDelete(id: string) {
    if (!confirm('Hapus transaksi ini?')) return;
    await remove(id);
  }

  return (
    <div className="px-5 pt-7">
      <h1 className="text-xl font-bold text-zinc-900">Transaksi</h1>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari catatan atau kategori"
            className="input pl-9"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-zinc-100 p-1">
        {(
          [
            { v: 'all', label: 'Semua' },
            { v: 'income', label: 'Masuk' },
            { v: 'expense', label: 'Keluar' },
          ] as { v: Filter; label: string }[]
        ).map(({ v, label }) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={classNames(
              'rounded-xl py-2 text-sm font-medium transition',
              filter === v
                ? 'bg-white text-zinc-900 shadow-soft'
                : 'text-zinc-500 hover:text-zinc-800'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-5">
        {loading ? (
          <div className="card p-8 text-center text-sm text-zinc-500">Memuat...</div>
        ) : grouped.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-zinc-500">Tidak ada transaksi.</p>
          </div>
        ) : (
          grouped.map(([dateKey, items]) => {
            const dayTotal = items.reduce(
              (acc, t) => acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)),
              0
            );
            return (
              <section key={dateKey}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {formatDate(dateKey)}
                  </span>
                  <span
                    className={
                      dayTotal >= 0
                        ? 'text-xs font-semibold tabular-nums text-brand-700'
                        : 'text-xs font-semibold tabular-nums text-rose-600'
                    }
                  >
                    {dayTotal >= 0 ? '+' : ''}
                    {formatIDR(dayTotal)}
                  </span>
                </div>
                <div className="card divide-y divide-zinc-100 p-1">
                  {items.map((tx) => (
                    <TransactionItem key={tx.id} tx={tx} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
