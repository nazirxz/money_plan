import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { MonthDelta } from '@/hooks/useMonthlyStats';
import { classNames, formatIDR, formatIDRCompact } from '@/lib/utils';

type Metric = 'expense' | 'income';

interface Props {
  metric: Metric;
  thisMonth: number;
  lastMonth: number;
  delta: MonthDelta;
  projected?: number;
  daysElapsed?: number;
  daysInMonth?: number;
}

const LABELS: Record<Metric, { title: string; deltaPrefix: string }> = {
  expense: { title: 'Pengeluaran bulan ini', deltaPrefix: 'dari bulan lalu' },
  income: { title: 'Pemasukan bulan ini', deltaPrefix: 'dari bulan lalu' },
};

export default function MonthCompareCard({
  metric,
  thisMonth,
  lastMonth,
  delta,
  projected,
  daysElapsed,
  daysInMonth,
}: Props) {
  const labels = LABELS[metric];
  const isExpense = metric === 'expense';

  // For expense: down (lower spending) is good = green; up is bad = red.
  // For income: up (more income) is good = green; down is bad = red.
  const isPositiveOutcome =
    delta.direction === 'flat'
      ? null
      : isExpense
      ? delta.direction === 'down'
      : delta.direction === 'up';

  const deltaTone =
    isPositiveOutcome === null
      ? 'text-zinc-500 bg-zinc-100'
      : isPositiveOutcome
      ? 'text-emerald-700 bg-emerald-50'
      : 'text-rose-700 bg-rose-50';

  const Icon =
    delta.direction === 'flat'
      ? Minus
      : delta.direction === 'up'
      ? ArrowUpRight
      : ArrowDownRight;

  const showProjection =
    isExpense &&
    typeof projected === 'number' &&
    typeof daysElapsed === 'number' &&
    typeof daysInMonth === 'number' &&
    daysElapsed > 0 &&
    daysElapsed < daysInMonth;

  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-zinc-500">{labels.title}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900">
        {formatIDR(thisMonth)}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={classNames(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
            deltaTone
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {lastMonth === 0 && delta.direction !== 'flat'
            ? 'Baru bulan ini'
            : delta.percent === null
            ? formatIDRCompact(Math.abs(delta.amount))
            : `${delta.percent > 0 ? '+' : ''}${delta.percent.toFixed(1)}%`}
        </span>
        <span className="text-xs text-zinc-500">
          {labels.deltaPrefix} ({formatIDRCompact(lastMonth)})
        </span>
      </div>

      {showProjection && (
        <p className="mt-2 text-[11px] text-zinc-500">
          Estimasi akhir bulan: <span className="font-semibold text-zinc-700 tabular-nums">{formatIDR(projected!)}</span>
          <span className="text-zinc-400"> · hari {daysElapsed}/{daysInMonth}</span>
        </p>
      )}
    </div>
  );
}
