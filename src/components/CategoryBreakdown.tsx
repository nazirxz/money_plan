import { useMemo, useState } from 'react';
import { useCategoryBreakdown } from '@/hooks/useCategoryBreakdown';
import { getIcon } from '@/lib/icons';
import { classNames, formatIDR, formatIDRCompact } from '@/lib/utils';
import type { TransactionWithCategory, TxType } from '@/lib/types';

interface Props {
  transactions: TransactionWithCategory[];
  start?: Date | null;
  end?: Date | null;
  initialType?: TxType;
  topN?: number;
}

export default function CategoryBreakdown({
  transactions,
  start,
  end,
  initialType = 'expense',
  topN = 5,
}: Props) {
  const [type, setType] = useState<TxType>(initialType);
  const { entries, total } = useCategoryBreakdown(transactions, { type, start, end });

  const displayed = useMemo(() => {
    if (entries.length <= topN) return { rows: entries, others: null };
    const rows = entries.slice(0, topN);
    const restTotal = entries.slice(topN).reduce((acc, e) => acc + e.total, 0);
    const restPercent = total > 0 ? (restTotal / total) * 100 : 0;
    return {
      rows,
      others: { total: restTotal, percent: restPercent, count: entries.length - topN },
    };
  }, [entries, topN, total]);

  const chartSegments = useMemo(() => {
    const segs = displayed.rows.map((e) => ({ value: e.total, color: e.color }));
    if (displayed.others) {
      segs.push({ value: displayed.others.total, color: '#cbd5e1' });
    }
    return segs;
  }, [displayed]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Per kategori</h2>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-0.5 text-[11px]">
          {(['expense', 'income'] as TxType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={classNames(
                'rounded-lg px-3 py-1 font-medium transition',
                type === t
                  ? 'bg-white text-zinc-900 shadow-soft'
                  : 'text-zinc-500'
              )}
            >
              {t === 'expense' ? 'Keluar' : 'Masuk'}
            </button>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 text-center text-sm text-zinc-500">
          Belum ada {type === 'expense' ? 'pengeluaran' : 'pemasukan'} untuk periode ini.
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-4">
            <DonutChart segments={chartSegments} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                Total
              </p>
              <p
                className={classNames(
                  'mt-0.5 text-xl font-bold tabular-nums',
                  type === 'expense' ? 'text-rose-600' : 'text-brand-700'
                )}
              >
                {formatIDR(total)}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {entries.length} kategori
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {displayed.rows.map((e) => {
              const Icon = getIcon(e.icon);
              return (
                <li key={e.categoryId ?? 'none'} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: e.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-zinc-800">
                        {e.name}
                      </p>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">
                        {formatIDRCompact(e.total)}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${e.percent}%`,
                            backgroundColor: e.color,
                          }}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] font-medium tabular-nums text-zinc-500">
                        {e.percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
            {displayed.others && (
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-300 text-[11px] font-bold text-white">
                  +{displayed.others.count}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-zinc-600">
                      Lainnya
                    </p>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-700">
                      {formatIDRCompact(displayed.others.total)}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-zinc-300"
                        style={{ width: `${displayed.others.percent}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[11px] font-medium tabular-nums text-zinc-500">
                      {displayed.others.percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}

function DonutChart({
  segments,
  size = 96,
  thickness = 14,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  if (total <= 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth={thickness}
        />
      </svg>
    );
  }

  let offset = 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={thickness}
      />
      {segments.map((seg, i) => {
        const fraction = seg.value / total;
        const dash = fraction * circumference;
        const gap = circumference - dash;
        const dashArray = `${dash} ${gap}`;
        const dashOffset = -offset;
        offset += dash;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}
