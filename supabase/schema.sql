-- =====================================================
-- MONEY PLANNER — Couple Workspace (Nazir & Richan)
-- =====================================================
-- File ini AMAN untuk dijalankan ulang — tidak pernah menghapus data.
-- Semua statement pakai IF NOT EXISTS / idempotent.
-- Jalankan di Supabase SQL Editor: Project > SQL Editor > New Query > paste > Run.
--
-- ⚠️  PERHATIAN: jangan pernah pakai `drop table` di file ini.
-- Untuk reset penuh, lakukan manual lewat Dashboard supaya tidak tidak sengaja kehapus.

-- =====================================================
-- 1. CATEGORIES (SHARED — dilihat & diedit kedua user)
-- =====================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text not null default 'tag',
  color text not null default '#10b981',
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "categories_all_authenticated" on public.categories;
create policy "categories_all_authenticated" on public.categories
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =====================================================
-- 2. TRANSACTIONS (SHARED, dengan label pembuat)
-- =====================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creator_name text,
  category_id uuid references public.categories(id) on delete set null,
  recurring_rule_id uuid,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount >= 0),
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Tambah kolom recurring_rule_id untuk DB lama yang belum punya (idempotent).
alter table public.transactions
  add column if not exists recurring_rule_id uuid;

create index if not exists transactions_date_idx on public.transactions(occurred_at desc);
create index if not exists transactions_user_idx on public.transactions(user_id);
create unique index if not exists transactions_recurring_idem on public.transactions(
  recurring_rule_id, ((occurred_at at time zone 'utc')::date)
) where recurring_rule_id is not null;

alter table public.transactions enable row level security;

drop policy if exists "transactions_all_authenticated" on public.transactions;
create policy "transactions_all_authenticated" on public.transactions
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =====================================================
-- 3. BUDGETS (SHARED — anggaran bulanan per kategori)
-- =====================================================
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null unique references public.categories(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists budgets_category_idx on public.budgets(category_id);

alter table public.budgets enable row level security;

drop policy if exists "budgets_all_authenticated" on public.budgets;
create policy "budgets_all_authenticated" on public.budgets
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =====================================================
-- 4. RECURRING RULES (SHARED — transaksi berulang otomatis)
-- =====================================================
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

-- =====================================================
-- 5. SEED KATEGORI DEFAULT (hanya kalau tabel masih kosong)
-- =====================================================
insert into public.categories (name, type, icon, color)
select * from (values
  ('Gaji',         'income',  'wallet',       '#10b981'),
  ('Bonus',        'income',  'gift',         '#22c55e'),
  ('Investasi',    'income',  'trending-up',  '#0ea5e9'),
  ('Hadiah',       'income',  'gift',         '#a855f7'),
  ('Makanan',      'expense', 'utensils',     '#f97316'),
  ('Transportasi', 'expense', 'car',          '#6366f1'),
  ('Belanja',      'expense', 'shopping-bag', '#ec4899'),
  ('Tagihan',      'expense', 'receipt',      '#ef4444'),
  ('Hiburan',      'expense', 'film',         '#a855f7'),
  ('Kesehatan',    'expense', 'heart',        '#14b8a6'),
  ('Pendidikan',   'expense', 'graduation-cap','#0ea5e9'),
  ('Liburan',      'expense', 'plane',        '#22c55e'),
  ('Hadiah',       'expense', 'gift',         '#f59e0b'),
  ('Lainnya',      'expense', 'tag',          '#64748b')
) as v(name, type, icon, color)
where not exists (select 1 from public.categories);

-- =====================================================
-- LANGKAH BERIKUTNYA — DAFTARKAN 2 USER
-- =====================================================
-- Opsi A (disarankan): di root proyek, isi SUPABASE_SERVICE_ROLE_KEY di .env.local
--   (Dashboard → Settings → API → service_role — jangan di-commit).
--   Lalu: npm run seed:users
--   Akun: nazirxz@money.app / nazir123 dan richan@money.app / richan123
--
-- Opsi B — manual di Dashboard:
-- A. Authentication → Providers → Email
--    - Matikan toggle "Confirm email"
--    - Matikan toggle "Allow new users to sign up"
--    - Klik Save
--
-- B. Authentication → Users → "Add user" → "Create new user"
--    USER 1:  Email: nazirxz@money.app   Password: nazir123   Auto Confirm: ✓
--    USER 2:  Email: richan@money.app    Password: richan123  Auto Confirm: ✓
--
-- Selesai. Kembali ke aplikasi → login pakai "nazirxz" / "nazir123".
