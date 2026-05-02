import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { classNames, formatAmountInput, parseAmountInput } from '@/lib/utils';
import { getIcon } from '@/lib/icons';
import type { TransactionWithCategory, TxType } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  onUpdated?: () => void;
  editing?: TransactionWithCategory | null;
}

export default function AddTransactionModal({
  open,
  onClose,
  onCreated,
  onUpdated,
  editing,
}: Props) {
  const { categories } = useCategories();
  const { create, update } = useTransactions();
  const isEdit = Boolean(editing);
  const [type, setType] = useState<TxType>('expense');
  const [amountText, setAmountText] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
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
      setDate(editing.occurred_at.slice(0, 10));
    } else {
      setType('expense');
      setAmountText('');
      setCategoryId(null);
      setNote('');
      setDate(new Date().toISOString().slice(0, 10));
    }
    setError(null);
  }, [open, editing]);

  useEffect(() => {
    // When type changes manually, reset to first category of that type — but
    // only if current selection is not valid for the type. This preserves the
    // editing transaction's category on open.
    if (categoryId && filtered.some((c) => c.id === categoryId)) return;
    setCategoryId(filtered[0]?.id ?? null);
  }, [filtered, categoryId]);

  const amount = parseAmountInput(amountText);

  async function handleSubmit() {
    if (amount <= 0) {
      setError('Jumlah harus lebih dari 0');
      return;
    }
    setSubmitting(true);
    setError(null);
    const occurred = isEdit && editing
      ? new Date(`${date}T${editing.occurred_at.slice(11, 19)}`)
      : new Date(`${date}T${new Date().toTimeString().slice(0, 8)}`);
    const payload = {
      type,
      amount,
      category_id: categoryId,
      note: note.trim() || null,
      occurred_at: occurred.toISOString(),
    };

    const { error } = isEdit && editing
      ? await update(editing.id, payload)
      : await create(payload);

    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    if (isEdit) onUpdated?.();
    else onCreated?.();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}>
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
                : 'text-zinc-600 hover:text-zinc-900'
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
          {filtered.map((c) => {
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
        {filtered.length === 0 && (
          <p className="mt-2 text-xs text-zinc-500">
            Belum ada kategori untuk tipe ini. Tambahkan di halaman Kategori.
          </p>
        )}
      </div>

      <div className="mt-5">
        <label className="text-xs font-medium text-zinc-500">Catatan (opsional)</label>
        <input
          className="input mt-1"
          placeholder="cth. Kopi pagi, gaji bulan ini"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="mt-5">
        <label className="text-xs font-medium text-zinc-500">Tanggal</label>
        <input
          type="date"
          className="input mt-1"
          value={date}
          onChange={(e) => setDate(e.target.value)}
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
