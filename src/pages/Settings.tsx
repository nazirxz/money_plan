import { useState } from 'react';
import { ChevronRight, Database, LogOut, Mail, RefreshCw, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { emailToUsername, getDisplayName } from '@/lib/users';
import { supabase } from '@/lib/supabase';
import { downloadFile } from '@/lib/csv';

export default function Settings() {
  const { user, signOut } = useAuth();
  const displayName = getDisplayName(user?.email);
  const username = emailToUsername(user?.email);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);

  async function handleBackup() {
    setBackupBusy(true);
    setBackupError(null);
    try {
      const [cats, txs, budgets, rules] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('budgets').select('*'),
        supabase.from('recurring_rules').select('*'),
      ]);
      const firstError =
        cats.error?.message ||
        txs.error?.message ||
        budgets.error?.message ||
        // recurring_rules table might not exist yet on older DBs — ignore that case.
        (rules.error && rules.error.code !== '42P01' ? rules.error.message : null);
      if (firstError) {
        setBackupError(firstError);
        return;
      }
      const payload = {
        version: 1,
        exported_at: new Date().toISOString(),
        exported_by: user?.email ?? null,
        categories: cats.data ?? [],
        transactions: txs.data ?? [],
        budgets: budgets.data ?? [],
        recurring_rules: rules.data ?? [],
      };
      const stamp = format(new Date(), 'yyyy-MM-dd_HHmm');
      downloadFile(
        `money-planner-backup_${stamp}.json`,
        JSON.stringify(payload, null, 2),
        'application/json'
      );
    } catch (e) {
      setBackupError(e instanceof Error ? e.message : 'Gagal membuat backup');
    } finally {
      setBackupBusy(false);
    }
  }

  return (
    <div className="px-5 pt-7">
      <h1 className="text-xl font-bold text-zinc-900">Profil</h1>

      <div className="mt-6 card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <span className="text-lg font-bold uppercase">
              {(displayName || '?').charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">{displayName}</p>
            <p className="truncate text-xs text-zinc-500">@{username}</p>
            <p className="text-xs text-zinc-500">
              Bergabung{' '}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 card divide-y divide-zinc-100">
        <Row icon={<Mail className="h-4 w-4" />} label="Email login" value={user?.email ?? '-'} />
        <Row
          icon={<Shield className="h-4 w-4" />}
          label="Penyimpanan"
          value="Supabase (terenkripsi)"
        />
      </div>

      <div className="mt-4">
        <Link
          to="/berulang"
          className="card flex items-center gap-3 p-4 transition hover:bg-zinc-50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <RefreshCw className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900">Transaksi Berulang</p>
            <p className="text-xs text-zinc-500">
              Auto-input gaji, sewa, atau langganan tiap bulan/minggu.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400" />
        </Link>
      </div>

      <div className="mt-4 card p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Database className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900">Backup data</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Unduh seluruh data (kategori, transaksi, anggaran) sebagai file JSON. Simpan di
              tempat aman sebagai cadangan manual.
            </p>
            <button
              onClick={handleBackup}
              disabled={backupBusy}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {backupBusy ? 'Memproses...' : 'Unduh backup JSON'}
            </button>
            {backupError && (
              <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {backupError}
              </p>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          if (confirm('Keluar dari akun?')) signOut();
        }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" /> Keluar
      </button>

      <p className="mt-8 text-center text-xs text-zinc-400">
        Money Planner · v0.1.0
      </p>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="truncate text-sm font-medium text-zinc-900">{value}</p>
      </div>
    </div>
  );
}
