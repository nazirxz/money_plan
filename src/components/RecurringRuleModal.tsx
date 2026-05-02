import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { useCategories } from '@/hooks/useCategories';
import { useRecurringRules } from '@/hooks/useRecurringRules';
import { classNames, formatAmountInput, parseAmountInput } from '@/lib/utils';
import { getIcon } from '@/lib/icons';
import type {
  RecurringFrequency,
  RecurringRuleWithCategory,
  TxType,
} from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: RecurringRuleWithCategory | null;
  onSaved?: () => void;
}

const DAYS_OF_WEEK = [
  { v: 0, label: 'Min' },
  { v: 1, label: 'Sen' },
  { v: 2, label: 'Sel' },
  { v: 3, label: 'Rab' },
  { v: 4, label: 'Kam' },
  { v: 5, label: 'Jum' },
  { v: 6, label: 'Sab' },
];

export default function RecurringRuleModal({ open, onClose, editing, onSaved }: Props) {
  const { categories } = useCategories();
  const { create, update } = useRecurringRules();
  const isEdit = Boolean(editing);

  const [type, setType] = useState<TxType>('expense');
  const [amountText, setAmountText] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmountText(formatAmountInput(Number(editing.amount)));
      setCategoryId(editing.category_id);
      setNote(editing.note ?? '');
      setFrequency(editing.frequency);
      setDayOfMonth(editing.day_of_month ?? 1);
      setDayOfWeek(editing.day_of_week ?? 1);
      setStartDate(editing.start_date);
      setEndDate(editing.end_date ?? '');
    } else {
      setType('expense');
      setAmountText('');
      setCategoryId(null);
      setNote('');
      setFrequency('monthly');
      setDayOfMonth(1);
      setDayOfWeek(1);
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate('');
    }
    setError(null);
  }, [open, editing]);

  useEffect(() => {
    if (categoryId && filteredCategories.some((c) => c.id === categoryId)) return;
    setCategoryId(filteredCategories[0]?.id ?? null);
  }, [filteredCategories, categoryId]);

  const amount = parseAmountInput(amountText);

  async function handleSubmit() {
    if (amount <= 0) {
      setError('Jumlah harus lebih dari 0');
      return;
    }
    if (!categoryId) {
      setError('Pilih kategori');
      return;
    }
    if (endDate && endDate < startDate) {
      setError('Tanggal selesai harus setelah tanggal mulai');
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload = {
      type,
      amount,
      category_id: categoryId,
      note: note.trim() || null,
      frequency,
      day_of_month: frequency === 'monthly' ? dayOfMonth : null,
      day_of_week: frequency === 'weekly' ? dayOfWeek : null,
      start_date: startDate,
      end_date: endDate || null,
    };
    const { error } = isEdit && editing
      ? await update(editing.id, payload)
      : await create(payload);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    onSaved?.();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Aturan Berulang' : 'Tambah Aturan Berulang'}
    >
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1">
        {(['expense', 'income'] as TxType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={classNames(
              'rounded-xl py-2.5 text-sm font-semibold transition',
              type === t
                ? t === 'expense'
                  ? 'bg-rose-500 text-white shadow-soft'
                  : 'bg-brand-600 text-white shadow-soft'
                : 'text-zinc-600'
            )}
          >
            {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <label className="text-xs font-medium text-zinc-500">Jumlah</label>
        <div className="mt-1 flex items-baseline gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200">
          <span className="text-sm font-medium text-zinc-500">Rp</span>
          <input
            inputMode="numeric"
            placeholder="0"
            value={formatAmountInput(amount)}
            onChange={(e) => setAmountText(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-bold tracking-tight text-zinc-900 outline-none placeholder:text-zinc-300"
          />
        </div>
      </div>

      <div className="mt-5">
        <label className="text-xs font-medium text-zinc-500">Kategori</label>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {filteredCategories.map((c) => {
            const Icon = getIcon(c.icon);
            const active = categoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={classNames(
                  'flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center transition active:scale-95',
                  active
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                )}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: c.color }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="line-clamp-1 text-[11px] font-medium text-zinc-700">
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <label className="text-xs font-medium text-zinc-500">Frekuensi</label>
        <div className="mt-1 grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100 p-1">
          {(['monthly', 'weekly'] as RecurringFrequency[]).map((f) => (
            <button
              key={f}
              onClick={() => setFrequency(f)}
              className={classNames(
                'rounded-xl py-2 text-sm font-medium transition',
                frequency === f
                  ? 'bg-white text-zinc-900 shadow-soft'
                  : 'text-zinc-500'
              )}
            >
              {f === 'monthly' ? 'Bulanan' : 'Mingguan'}
            </button>
          ))}
        </div>
      </div>

      {frequency === 'monthly' ? (
        <div className="mt-4">
          <label className="text-xs font-medium text-zinc-500">
            Tanggal setiap bulan (1–28)
          </label>
          <input
            type="number"
            min={1}
            max={28}
            value={dayOfMonth}
            onChange={(e) =>
              setDayOfMonth(
                Math.max(1, Math.min(28, Number(e.target.value) || 1))
              )
            }
            className="input mt-1"
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            Maks. tanggal 28 untuk hindari masalah Februari.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <label className="text-xs font-medium text-zinc-500">Hari setiap minggu</label>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((d) => {
              const active = dayOfWeek === d.v;
              return (
                <button
                  key={d.v}
                  onClick={() => setDayOfWeek(d.v)}
                  className={classNames(
                    'rounded-lg py-2 text-xs font-semibold transition',
                    active
                      ? 'bg-brand-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  )}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-zinc-500">Mulai</label>
          <input
            type="date"
            className="input mt-1"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500">
            Selesai (opsional)
          </label>
          <input
            type="date"
            className="input mt-1"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
          />
        </div>
      </div>

      <div className="mt-5">
        <label className="text-xs font-medium text-zinc-500">Catatan (opsional)</label>
        <input
          className="input mt-1"
          placeholder="cth. Sewa kos, Gaji, Spotify"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || amount <= 0}
        className="btn-primary mt-6 w-full"
      >
        {submitting ? 'Menyimpan...' : isEdit ? 'Simpan perubahan' : 'Simpan'}
      </button>
    </Modal>
  );
}
