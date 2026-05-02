import { addMonths, addWeeks, format, isAfter, isBefore, parseISO } from 'date-fns';
import type { RecurringRule } from './types';

/**
 * Compute the dates a rule should have generated transactions for, between
 * its start (or last_generated_at + 1 cycle) and `today`. Returns dates as
 * YYYY-MM-DD strings sorted ascending.
 *
 * Idempotent: caller can re-run with the same rule + today and a unique index
 * on (recurring_rule_id, occurred_date) prevents duplicate inserts.
 */
export function getMissedOccurrences(rule: RecurringRule, today: Date): string[] {
  const start = parseISO(rule.start_date);
  const end = rule.end_date ? parseISO(rule.end_date) : null;
  const lastGen = rule.last_generated_at ? parseISO(rule.last_generated_at) : null;

  // Find first candidate occurrence >= start_date.
  let candidate: Date;
  if (rule.frequency === 'monthly') {
    if (rule.day_of_month == null) return [];
    candidate = new Date(start.getFullYear(), start.getMonth(), rule.day_of_month);
    if (isBefore(candidate, start)) candidate = addMonths(candidate, 1);
  } else {
    if (rule.day_of_week == null) return [];
    const dow = rule.day_of_week;
    candidate = new Date(start);
    while (candidate.getDay() !== dow) {
      candidate.setDate(candidate.getDate() + 1);
    }
  }

  const out: string[] = [];
  // Cap iteration to avoid infinite loop on bad input. 5 years of weekly = 260.
  for (let i = 0; i < 600; i++) {
    if (isAfter(candidate, today)) break;
    if (end && isAfter(candidate, end)) break;
    if (!lastGen || isAfter(candidate, lastGen)) {
      out.push(format(candidate, 'yyyy-MM-dd'));
    }
    candidate =
      rule.frequency === 'monthly' ? addMonths(candidate, 1) : addWeeks(candidate, 1);
  }
  return out;
}
