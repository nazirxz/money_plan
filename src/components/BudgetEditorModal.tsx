import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { getIcon } from '@/lib/icons';
import { formatAmountInput, parseAmountInput } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function BudgetEditorModal({ open, onClose, onSaved }: Props) {
  const { categories } = useCategories();
  const { budgets, upsertMany } = useBudgets();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, string> = {};
    for (const cat of expenseCategories) {
      const existing = budgets.find((b) => b.category_id === cat.id);
      initial[cat.id] = existing ? formatAmountInput(Number(existing.amount)) : '';
    }
    setDrafts(initial);
    setError(null);
  }, [open, expenseCategories, budgets]);

  function setDraft(id: string, raw: string) {
    const value = parseAmountInput(raw);
    setDrafts((prev) => ({ ...prev, [id]: value ? formatAmountInput(value) : '' }));
  }

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    const amounts = new Map<string, number>();
    for (const cat of expenseCategories) {
      const existing = budgets.find((b) => b.category_id === cat.id);
      const next = parseAmountInput(drafts[cat.id] ?? '');
      const prev = existing ? Number(existing.amount) : 0;
      // Only push entries that changed.
      if (next !== prev) amounts.set(cat.id, next);
    }
    if (amounts.size === 0) {
      setSubmitting(false);
      onClose();
      return;
    }
    const { error } = await upsertMany(amounts);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    onSaved?.();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Atur Anggaran Bulanan">
      <p className="text-xs text-zinc-500">
        Tetapkan limit per kategori. Kosongkan untuk menghapus anggaran kategori
        tersebut.
      </p>

      {expenseCategories.length === 0 ? (
        <p className="mt-4 text-center text-sm text-zinc-500">
          Belum ada kategori pengeluaran.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {expenseCategories.map((cat) => {
            const Icon = getIcon(cat.icon);
            return (
              <li
                key={cat.id}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 truncate text-sm font-medium text-zinc-800">
                  {cat.name}
                </span>
                <div className="flex items-baseline gap-1.5 rounded-xl bg-zinc-50 px-3 py-1.5 focus-within:ring-2 focus-within:ring-brand-200">
                  <span className="text-[11px] font-medium text-zinc-500">Rp</span>
                  <input
                    inputMode="numeric"
                    placeholder="0"
                    value={drafts[cat.id] ?? ''}
                    onChange={(e) => setDraft(cat.id, e.target.value)}
                    className="w-24 bg-transparent text-right text-sm font-semibold tabular-nums text-zinc-900 outline-none placeholder:text-zinc-300"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={submitting}
        className="btn-primary mt-5 w-full"
      >
        {submitting ? 'Menyimpan...' : 'Simpan'}
      </button>
    </Modal>
  );
}
