import { Trash2 } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import type { TransactionWithCategory } from '@/lib/types';
import { formatIDR, formatTime } from '@/lib/utils';

interface Props {
  tx: TransactionWithCategory;
  onDelete?: (id: string) => void;
}

export default function TransactionItem({ tx, onDelete }: Props) {
  const Icon = getIcon(tx.category?.icon ?? null);
  const color = tx.category?.color ?? '#64748b';
  const isIncome = tx.type === 'income';

  return (
    <div className="group flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 transition hover:bg-zinc-50">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: color }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">
          {tx.category?.name ?? 'Tanpa kategori'}
        </p>
        <p className="truncate text-xs text-zinc-500">
          {tx.note ? tx.note : formatTime(tx.occurred_at)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={
            isIncome
              ? 'text-sm font-bold tabular-nums text-brand-600'
              : 'text-sm font-bold tabular-nums text-rose-600'
          }
        >
          {isIncome ? '+' : '−'} {formatIDR(tx.amount)}
        </span>
        {onDelete && (
          <button
            aria-label="Hapus"
            onClick={() => onDelete(tx.id)}
            className="rounded-full p-1.5 text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
