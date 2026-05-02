import { useMemo } from 'react';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import type { TransactionWithCategory } from '@/lib/types';

export interface PeriodTotal {
  income: number;
  expense: number;
}

export interface MonthDelta {
  amount: number;
  percent: number | null;
  direction: 'up' | 'down' | 'flat';
}

export interface MonthlyStats {
  thisMonth: PeriodTotal;
  lastMonth: PeriodTotal;
  expenseDelta: MonthDelta;
  incomeDelta: MonthDelta;
  daysElapsed: number;
  daysInMonth: number;
  projectedExpense: number;
}

function computeDelta(current: number, previous: number): MonthDelta {
  const amount = current - previous;
  if (previous === 0) {
    return {
      amount,
      percent: null,
      direction: amount === 0 ? 'flat' : 'up',
    };
  }
  const percent = (amount / previous) * 100;
  const direction: MonthDelta['direction'] =
    amount === 0 ? 'flat' : amount > 0 ? 'up' : 'down';
  return { amount, percent, direction };
}

export function useMonthlyStats(
  transactions: TransactionWithCategory[]
): MonthlyStats {
  return useMemo(() => {
    const now = new Date();
    const thisStart = startOfMonth(now);
    const thisEnd = endOfMonth(now);
    const lastStart = startOfMonth(subMonths(now, 1));
    const lastEnd = endOfMonth(subMonths(now, 1));

    const thisMonth: PeriodTotal = { income: 0, expense: 0 };
    const lastMonth: PeriodTotal = { income: 0, expense: 0 };

    for (const t of transactions) {
      const d = new Date(t.occurred_at);
      const amount = Number(t.amount);
      if (d >= thisStart && d <= thisEnd) {
        if (t.type === 'income') thisMonth.income += amount;
        else thisMonth.expense += amount;
      } else if (d >= lastStart && d <= lastEnd) {
        if (t.type === 'income') lastMonth.income += amount;
        else lastMonth.expense += amount;
      }
    }

    const daysElapsed = now.getDate();
    const daysInMonth = thisEnd.getDate();
    const projectedExpense =
      daysElapsed > 0
        ? Math.round((thisMonth.expense / daysElapsed) * daysInMonth)
        : 0;

    return {
      thisMonth,
      lastMonth,
      expenseDelta: computeDelta(thisMonth.expense, lastMonth.expense),
      incomeDelta: computeDelta(thisMonth.income, lastMonth.income),
      daysElapsed,
      daysInMonth,
      projectedExpense,
    };
  }, [transactions]);
}
