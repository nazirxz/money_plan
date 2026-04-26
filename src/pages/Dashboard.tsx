import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, ChevronRight, Eye } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/contexts/AuthContext';
import TransactionItem from '@/components/TransactionItem';
import { formatIDR, formatIDRCompact } from '@/lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions();

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let totalIncome = 0;
    let totalExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;

    for (const t of transactions) {
      if (t.type === 'income') totalIncome += Number(t.amount);
      else totalExpense += Number(t.amount);

      const d = new Date(t.occurred_at);
      if (d >= monthStart) {
        if (t.type === 'income') monthIncome += Number(t.amount);
        else monthExpense += Number(t.amount);
      }
    }

    return {
      balance: totalIncome - totalExpense,
      monthIncome,
      monthExpense,
      monthNet: monthIncome - monthExpense,
    };
  }, [transactions]);

  const recent = transactions.slice(0, 5);
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat pagi';
    if (h < 15) return 'Selamat siang';
    if (h < 19) return 'Selamat sore';
    return 'Selamat malam';
  }, []);
  const name = (user?.email ?? '').split('@')[0] || 'kamu';

  return (
    <div className="px-5 pt-7">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">{greeting},</p>
          <h1 className="text-xl font-bold capitalize text-zinc-900">{name}</h1>
        </div>
      </header>

      {/* Balance Card */}
      <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-emerald-500 p-5 text-white shadow-card">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <Eye className="h-3.5 w-3.5" /> Saldo total
          </div>
          <p className="mt-1.5 text-3xl font-bold tracking-tight">
            {loading ? '...' : formatIDR(stats.balance)}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <StatPill
              label="Pemasukan bulan ini"
              value={stats.monthIncome}
              tone="up"
            />
            <StatPill
              label="Pengeluaran bulan ini"
              value={stats.monthExpense}
              tone="down"
            />
          </div>
        </div>
      </div>

      {/* Net Summary */}
      <div className="mt-4 card flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-zinc-500">Selisih bulan ini</p>
          <p
            className={
              stats.monthNet >= 0
                ? 'mt-0.5 text-lg font-bold text-brand-700 tabular-nums'
                : 'mt-0.5 text-lg font-bold text-rose-600 tabular-nums'
            }
          >
            {stats.monthNet >= 0 ? '+' : ''}
            {formatIDR(stats.monthNet)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Transaksi</p>
          <p className="mt-0.5 text-lg font-bold text-zinc-900 tabular-nums">
            {transactions.length}
          </p>
        </div>
      </div>

      {/* Recent */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-zinc-900">Transaksi terbaru</h2>
          <Link
            to="/transaksi"
            className="flex items-center gap-0.5 text-xs font-medium text-brand-700"
          >
            Lihat semua <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="card p-6 text-center text-sm text-zinc-500">Memuat...</div>
        ) : recent.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-zinc-500">Belum ada transaksi.</p>
            <p className="mt-1 text-xs text-zinc-400">
              Tap tombol + di bawah untuk menambah.
            </p>
          </div>
        ) : (
          <div className="card divide-y divide-zinc-100 p-1">
            {recent.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'up' | 'down';
}) {
  const Icon = tone === 'up' ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/80">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-base font-bold tabular-nums">{formatIDRCompact(value)}</p>
    </div>
  );
}
