import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getMissedOccurrences } from '@/lib/recurring';
import type { RecurringRule } from '@/lib/types';

interface SyncState {
  inFlight: boolean;
  done: boolean;
}

const sessionState: SyncState = { inFlight: false, done: false };

/**
 * Run once per browser session: for each active recurring rule, insert any
 * occurrences that should have happened up to today. The unique index on
 * transactions(recurring_rule_id, occurred_date) makes inserts idempotent —
 * even if two devices race, no duplicates can land.
 */
export function useRecurringSync(onChanged?: () => void) {
  const callbackRef = useRef(onChanged);
  callbackRef.current = onChanged;

  useEffect(() => {
    if (sessionState.inFlight || sessionState.done) return;
    sessionState.inFlight = true;

    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) return;

        const { data: rules, error: rulesErr } = await supabase
          .from('recurring_rules')
          .select('*')
          .eq('active', true);
        if (rulesErr) {
          // Table not yet migrated — skip silently.
          if (rulesErr.code === '42P01') return;
          console.warn('[recurring] fetch rules failed:', rulesErr.message);
          return;
        }

        const today = new Date();
        let inserted = 0;

        for (const rule of (rules ?? []) as RecurringRule[]) {
          const dates = getMissedOccurrences(rule, today);
          if (dates.length === 0) continue;

          const rows = dates.map((d) => ({
            user_id: rule.user_id,
            creator_name: rule.creator_name,
            recurring_rule_id: rule.id,
            category_id: rule.category_id,
            type: rule.type,
            amount: rule.amount,
            note: rule.note,
            // Use noon UTC so the date column lands on the intended day in
            // most timezones (the unique index is on occurred_at::date UTC).
            occurred_at: `${d}T12:00:00.000Z`,
          }));

          // Insert with onConflict on the unique idempotency index — duplicates
          // are dropped, not errored. Supabase upsert respects the partial unique.
          const { error: insErr } = await supabase
            .from('transactions')
            .upsert(rows, {
              onConflict: 'recurring_rule_id,occurred_at',
              ignoreDuplicates: true,
            });
          if (insErr) {
            // Fallback: try plain insert; per-row duplicate errors are acceptable.
            const { error: fallbackErr } = await supabase.from('transactions').insert(rows);
            if (fallbackErr && !/duplicate/i.test(fallbackErr.message)) {
              console.warn('[recurring] insert failed:', fallbackErr.message);
              continue;
            }
          }

          inserted += rows.length;
          const lastDate = dates[dates.length - 1];
          await supabase
            .from('recurring_rules')
            .update({ last_generated_at: lastDate, updated_at: new Date().toISOString() })
            .eq('id', rule.id);
        }

        if (inserted > 0) callbackRef.current?.();
      } finally {
        sessionState.inFlight = false;
        sessionState.done = true;
      }
    })();
  }, []);
}
