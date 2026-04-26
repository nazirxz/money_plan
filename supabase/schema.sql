-- Money Planner Schema
-- Jalankan di Supabase SQL Editor (Project > SQL Editor > New Query)

-- =====================================================
-- 1. CATEGORIES
-- =====================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text not null default 'tag',
  color text not null default '#10b981',
  created_at timestamptz not null default now()
);

create index if not exists categories_user_idx on public.categories(user_id);

alter table public.categories enable row level security;

drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own" on public.categories
  for select using (auth.uid() = user_id);

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id);

drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

-- =====================================================
-- 2. TRANSACTIONS
-- =====================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount >= 0),
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_idx on public.transactions(user_id);
create index if not exists transactions_user_date_idx on public.transactions(user_id, occurred_at desc);

alter table public.transactions enable row level security;

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

-- =====================================================
-- 3. SEED DEFAULT CATEGORIES ON SIGNUP
-- =====================================================
create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, type, icon, color) values
    (new.id, 'Gaji',         'income',  'wallet',       '#10b981'),
    (new.id, 'Bonus',        'income',  'gift',         '#22c55e'),
    (new.id, 'Investasi',    'income',  'trending-up',  '#0ea5e9'),
    (new.id, 'Makanan',      'expense', 'utensils',     '#f97316'),
    (new.id, 'Transportasi', 'expense', 'car',          '#6366f1'),
    (new.id, 'Belanja',      'expense', 'shopping-bag', '#ec4899'),
    (new.id, 'Tagihan',      'expense', 'receipt',      '#ef4444'),
    (new.id, 'Hiburan',      'expense', 'film',         '#a855f7'),
    (new.id, 'Kesehatan',    'expense', 'heart',        '#14b8a6'),
    (new.id, 'Lainnya',      'expense', 'tag',          '#64748b');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_default_categories();
