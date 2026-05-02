import { useMemo, useState } from 'react';
import { ChevronDown, Download, Filter as FilterIcon, Search, X } from 'lucide-react';
import { endOfMonth, format, startOfMonth, subDays, subMonths } from 'date-fns';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import TransactionItem from '@/components/TransactionItem';
import AddTransactionModal from '@/components/AddTransactionModal';
import { classNames, formatDate, formatIDR, formatIDRCompact } from '@/lib/utils';
import { downloadFile, toCsv } from '@/lib/csv';
import type { TransactionWithCategory, TxType } from '@/lib/types';

type TypeFilter = 'all' | TxType;
type Period = 'all' | 'this_month' | 'last_month' | '30d' | 'custom';

const PERIODS: { v: Period; label: string }[] = [
  { v: 'all', label: 'Semua' },
  { v: 'this_month', label: 'Bulan ini' },
  { v: 'last_month', label: 'Bulan lalu' },
  { v: '30d', label: '30 hari' },
  { v: 'custom', label: 'Custom' },
];

function periodRange(
  period: Period,
  customStart: string,
  customEnd: string
): { start: Date | null; end: Date | null } {
  const now = new Date();
  switch (period) {
    case 'this_month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last_month': {
      const prev = subMonths(now, 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
    case '30d':
      return { start: subDays(now, 30), end: now };
    case 'custom':
      return {
        start: customStart ? new Date(`${customStart}T00:00:00`) : null,
        end: customEnd ? new Date(`${customEnd}T23:59:59`) : null,
      };
    default:
      return { start: null, end: null };
  }
}

export default function Transactions() {
  const { transactions, loading, remove } = useTransactions();
  const { categories } = useCategories();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<TransactionWithCategory | null>(null);
  const [period, setPeriod] = useState<Period>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [catOpen, setCatOpen] = useState(false);

  const visibleCategories = useMemo(
    () => (typeFilter === 'all' ? categories : categories.filter((c) => c.type === typeFilter)),
    [categories, typeFilter]
  );

  const range = useMemo(
    () => periodRange(period, customStart, customEnd),
    [period, customStart, customEnd]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (selectedCats.size > 0 && !(t.category_id && selectedCats.has(t.category_id))) {
        return false;
      }
      if (range.start || range.end) {
        const d = new Date(t.occurred_at);
        if (range.start && d < range.start) return false;
        if (range.end && d > range.end) return false;
      }
      if (!q) return true;
      const hay = [t.note ?? '', t.category?.name ?? '', t.creator_name ?? '']
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [transactions, typeFilter, query, range, selectedCats]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.type === 'income') income += Number(t.amount);
      else expense += Number(t.amount);
    }
    return { income, expense, net: income - expense, count: filtered.length };
  }, [filtered]);

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

  const hasActiveFilters =
    typeFilter !== 'all' ||
    period !== 'all' ||
    selectedCats.size > 0 ||
    query.trim().length > 0;

  function clearFilters() {
    setTypeFilter('all');
    setQuery('');
    setPeriod('all');
    setCustomStart('');
    setCustomEnd('');
    setSelectedCats(new Set());
  }

  function toggleCat(id: string) {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus transaksi ini?')) return;
    await remove(id);
  }

  function handleExportCsv() {
    if (filtered.length === 0) {
      alert('Tidak ada transaksi untuk diekspor.');
      return;
    }
    const headers = ['Tanggal', 'Waktu', 'Tipe', 'Kategori', 'Jumlah', 'Catatan', 'Pembuat'];
    const rows = filtered.map((t) => {
      const d = new Date(t.occurred_at);
      return {
        Tanggal: format(d, 'yyyy-MM-dd'),
        Waktu: format(d, 'HH:mm'),
        Tipe: t.type === 'income' ? 'Masuk' : 'Keluar',
        Kategori: t.category?.name ?? '',
        Jumlah: Number(t.amount),
        Catatan: t.note ?? '',
        Pembuat: t.creator_name ?? '',
      };
    });
    const stamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    const filename = `money-planner_${stamp}.csv`;
    downloadFile(filename, toCsv(rows, headers), 'text/csv');
  }

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Transaksi</h1>
        <div className="flex items-center gap-1.5">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
            >
              <X className="h-3.5 w-3.5" /> Reset
            </button>
          )}
          <button
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
            title="Ekspor sebagai CSV"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

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
          ] as { v: TypeFilter; label: string }[]
        ).map(({ v, label }) => (
          <button
            key={v}
            onClick={() => setTypeFilter(v)}
            className={classNames(
              'rounded-xl py-2 text-sm font-medium transition',
              typeFilter === v
                ? 'bg-white text-zinc-900 shadow-soft'
                : 'text-zinc-500 hover:text-zinc-800'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Period filter */}
      <div className="mt-3 -mx-5 overflow-x-auto px-5">
        <div className="flex gap-2">
          {PERIODS.map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setPeriod(v)}
              className={classNames(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                period === v
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {period === 'custom' && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-medium text-zinc-500">Dari</label>
            <input
              type="date"
              className="input mt-1"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              max={customEnd || undefined}
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-500">Sampai</label>
            <input
              type="date"
              className="input mt-1"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              min={customStart || undefined}
            />
          </div>
        </div>
      )}

      {/* Category multiselect */}
      <div className="mt-3">
        <button
          onClick={() => setCatOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-700"
        >
          <span className="inline-flex items-center gap-2">
            <FilterIcon className="h-4 w-4 text-zinc-500" />
            {selectedCats.size === 0
              ? 'Semua kategori'
              : `${selectedCats.size} kategori dipilih`}
          </span>
          <ChevronDown
            className={classNames(
              'h-4 w-4 text-zinc-400 transition',
              catOpen && 'rotate-180'
            )}
          />
        </button>
        {catOpen && (
          <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-3">
            {visibleCategories.length === 0 ? (
              <p className="text-xs text-zinc-500">Tidak ada kategori.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {visibleCategories.map((c) => {
                  const active = selectedCats.has(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCat(c.id)}
                      className={classNames(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition',
                        active
                          ? 'border-transparent text-white'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                      )}
                      style={active ? { backgroundColor: c.color } : undefined}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedCats.size > 0 && (
              <button
                onClick={() => setSelectedCats(new Set())}
                className="mt-3 text-xs font-medium text-brand-700 hover:underline"
              >
                Hapus pilihan
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      {hasActiveFilters && !loading && (
        <div className="mt-4 card grid grid-cols-3 gap-2 p-3">
          <Cell label="Transaksi" value={String(summary.count)} tone="neutral" />
          <Cell label="Masuk" value={formatIDRCompact(summary.income)} tone="up" />
          <Cell label="Keluar" value={formatIDRCompact(summary.expense)} tone="down" />
        </div>
      )}

      <div className="mt-5 space-y-5">
        {loading ? (
          <div className="card p-8 text-center text-sm text-zinc-500">Memuat...</div>
        ) : grouped.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-zinc-500">Tidak ada transaksi.</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 text-xs font-medium text-brand-700 hover:underline"
              >
                Reset filter
              </button>
            )}
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
                    <TransactionItem
                      key={tx.id}
                      tx={tx}
                      onDelete={handleDelete}
                      onEdit={setEditing}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      <AddTransactionModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        editing={editing}
        onUpdated={() => setEditing(null)}
      />
    </div>
  );
}

function Cell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'up' | 'down' | 'neutral';
}) {
  const toneClass =
    tone === 'up'
      ? 'text-brand-700'
      : tone === 'down'
      ? 'text-rose-600'
      : 'text-zinc-900';
  return (
    <div className="text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className={classNames('mt-0.5 text-sm font-bold tabular-nums', toneClass)}>
        {value}
      </p>
    </div>
  );
}
