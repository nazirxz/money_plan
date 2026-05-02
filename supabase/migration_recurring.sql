-- =====================================================
-- MIGRATION: Recurring transactions (non-destructive)
-- =====================================================
-- Jalankan ini SEKALI di Supabase SQL Editor jika kamu sudah punya data
-- di tabel transactions/categories/budgets dan tidak mau wipe ulang.
-- Aman untuk dijalankan ulang (semua statement idempotent).

-- Tambah kolom recurring_rule_id ke transactions (kalau belum ada)
alter table public.transactions
  add column if not exists recurring_rule_id uuid;

create unique index if not exists transactions_recurring_idem on public.transactions(
  recurring_rule_id, ((occurred_at at time zone 'utc')::date)
) where recurring_rule_id is not null;

-- Tabel recurring_rules
create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creator_name text,
  category_id uuid not null references public.categories(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  note text,
  frequency text not null check (frequency in ('monthly', 'weekly')),
  day_of_month smallint check (day_of_month is null or day_of_month between 1 and 28),
  day_of_week smallint check (day_of_week is null or day_of_week between 0 and 6),
  start_date date not null,
  end_date date,
  last_generated_at date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (frequency = 'monthly' and day_of_month is not null and day_of_week is null)
    or (frequency = 'weekly' and day_of_week is not null and day_of_month is null)
  )
);

create index if not exists recurring_rules_active_idx on public.recurring_rules(active);

alter table public.recurring_rules enable row level security;

drop policy if exists "recurring_rules_all_authenticated" on public.recurring_rules;
create policy "recurring_rules_all_authenticated" on public.recurring_rules
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- FK transactions -> recurring_rules (idempotent: cek pg_constraint)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transactions_recurring_rule_fk'
  ) then
    alter table public.transactions
      add constraint transactions_recurring_rule_fk
      foreign key (recurring_rule_id) references public.recurring_rules(id)
      on delete set null;
  end if;
end $$;
