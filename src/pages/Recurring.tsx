import { useMemo, useState } from 'react';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addMonths, addWeeks, format, isAfter, isBefore, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRecurringRules } from '@/hooks/useRecurringRules';
import RecurringRuleModal from '@/components/RecurringRuleModal';
import { getIcon } from '@/lib/icons';
import { classNames, formatIDR } from '@/lib/utils';
import type { RecurringRuleWithCategory } from '@/lib/types';

const DAY_OF_WEEK_LABELS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function ruleSchedule(rule: RecurringRuleWithCategory): string {
  if (rule.frequency === 'monthly' && rule.day_of_month != null) {
    return `Tiap tanggal ${rule.day_of_month}`;
  }
  if (rule.frequency === 'weekly' && rule.day_of_week != null) {
    return `Tiap ${DAY_OF_WEEK_LABELS[rule.day_of_week]}`;
  }
  return '-';
}

function nextRunOf(rule: RecurringRuleWithCategory, today: Date): Date | null {
  const start = parseISO(rule.start_date);
  const end = rule.end_date ? parseISO(rule.end_date) : null;
  const lastGen = rule.last_generated_at ? parseISO(rule.last_generated_at) : null;
  const cursor = lastGen && isAfter(lastGen, start) ? lastGen : start;

  let candidate: Date;
  if (rule.frequency === 'monthly' && rule.day_of_month != null) {
    candidate = new Date(cursor.getFullYear(), cursor.getMonth(), rule.day_of_month);
    while (isBefore(candidate, today) || (lastGen && !isAfter(candidate, lastGen))) {
      candidate = addMonths(candidate, 1);
    }
  } else if (rule.frequency === 'weekly' && rule.day_of_week != null) {
    candidate = new Date(cursor);
    while (candidate.getDay() !== rule.day_of_week) {
      candidate.setDate(candidate.getDate() + 1);
    }
    while (isBefore(candidate, today) || (lastGen && !isAfter(candidate, lastGen))) {
      candidate = addWeeks(candidate, 1);
    }
  } else {
    return null;
  }
  if (end && isAfter(candidate, end)) return null;
  return candidate;
}

export default function Recurring() {
  const { rules, loading, update, remove } = useRecurringRules();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringRuleWithCategory | null>(null);

  const sorted = useMemo(() => {
    return [...rules].sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return a.created_at < b.created_at ? 1 : -1;
    });
  }, [rules]);

  async function handleDelete(rule: RecurringRuleWithCategory) {
    if (!confirm(`Hapus aturan "${rule.note || rule.category?.name}"? Transaksi yang sudah dibuat tidak akan terhapus.`)) return;
    await remove(rule.id);
  }

  async function toggleActive(rule: RecurringRuleWithCategory) {
    await update(rule.id, { active: !rule.active });
  }

  function openAdd() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(rule: RecurringRuleWithCategory) {
    setEditing(rule);
    setOpen(true);
  }

  const today = new Date();

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Link
          to="/pengaturan"
          className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-zinc-900">Transaksi Berulang</h1>
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        Aturan ini otomatis membuat transaksi pada tanggal yang ditentukan (gaji, sewa,
        langganan). Sinkronisasi terjadi saat aplikasi dibuka.
      </p>

      <button
        onClick={openAdd}
        className="btn-primary mt-5 w-full"
      >
        <Plus className="h-4 w-4" /> Tambah aturan
      </button>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="card p-8 text-center text-sm text-zinc-500">Memuat...</div>
        ) : sorted.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-zinc-500">Belum ada aturan berulang.</p>
            <p className="mt-1 text-xs text-zinc-400">
              Tambahkan untuk auto-input gaji, sewa, atau langganan tiap bulan.
            </p>
          </div>
        ) : (
          sorted.map((rule) => {
            const Icon = getIcon(rule.category?.icon ?? null);
            const color = rule.category?.color ?? '#94a3b8';
            const next = rule.active ? nextRunOf(rule, today) : null;
            return (
              <div
                key={rule.id}
                className={classNames(
                  'card p-4 transition',
                  !rule.active && 'opacity-60'
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-900">
                          {rule.note || rule.category?.name || 'Aturan'}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {rule.category?.name ?? 'Tanpa kategori'} · {ruleSchedule(rule)}
                        </p>
                      </div>
                      <p
                        className={classNames(
                          'shrink-0 text-sm font-bold tabular-nums',
                          rule.type === 'income' ? 'text-brand-700' : 'text-rose-600'
                        )}
                      >
                        {rule.type === 'income' ? '+' : '−'} {formatIDR(Number(rule.amount))}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-zinc-500">
                        {next ? (
                          <>
                            Berikutnya: <span className="font-medium text-zinc-700">
                              {format(next, 'd MMM yyyy', { locale: id })}
                            </span>
                          </>
                        ) : rule.active ? (
                          'Tidak ada jadwal berikutnya'
                        ) : (
                          'Nonaktif'
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleActive(rule)}
                          className={classNames(
                            'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                            rule.active
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          )}
                        >
                          {rule.active ? 'Aktif' : 'Pause'}
                        </button>
                        <button
                          onClick={() => openEdit(rule)}
                          className="rounded-full p-1.5 text-zinc-500 hover:bg-brand-50 hover:text-brand-600"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule)}
                          className="rounded-full p-1.5 text-zinc-500 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <RecurringRuleModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
      />
    </div>
  );
}
