-- =====================================================
-- MONEY PLANNER — Couple Workspace (Nazir & Richan)
-- =====================================================
-- File ini idempotent: aman untuk dijalankan ulang.
-- Jalankan di Supabase SQL Editor: Project > SQL Editor > New Query > paste > Run.
-- Setelah ini, lanjutkan ke "LANGKAH BERIKUTNYA" di akhir file.

-- =====================================================
-- 0. CLEAN UP SCHEMA LAMA
-- =====================================================
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.seed_default_categories();
drop table if exists public.transactions cascade;
drop table if exists public.categories cascade;

-- =====================================================
-- 1. CATEGORIES (SHARED — dilihat & diedit kedua user)
-- =====================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text not null default 'tag',
  color text not null default '#10b981',
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories_all_authenticated" on public.categories
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =====================================================
-- 2. TRANSACTIONS (SHARED, dengan label pembuat)
-- =====================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creator_name text,
  category_id uuid references public.categories(id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount >= 0),
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index transactions_date_idx on public.transactions(occurred_at desc);
create index transactions_user_idx on public.transactions(user_id);

alter table public.transactions enable row level security;

create policy "transactions_all_authenticated" on public.transactions
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =====================================================
-- 3. SEED KATEGORI DEFAULT
-- =====================================================
insert into public.categories (name, type, icon, color) values
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
  ('Lainnya',      'expense', 'tag',          '#64748b');

-- =====================================================
-- LANGKAH BERIKUTNYA — DAFTARKAN 2 USER
-- =====================================================
-- Opsi A (disarankan): di root proyek, isi SUPABASE_SERVICE_ROLE_KEY di .env.local
--   (Dashboard → Settings → API → service_role — jangan di-commit).
--   Lalu: npm run seed:users
--   Akun: nazirxz@money.app / nazir123 dan richan@money.app / richan123
--
-- Opsi B — manual di Dashboard:
-- Buka Supabase Dashboard:
--
-- A. Authentication → Providers → Email
--    - Matikan toggle "Confirm email"  (biar bisa login tanpa verifikasi)
--    - Matikan toggle "Allow new users to sign up" (biar tidak ada user baru)
--    - Klik Save
--
-- B. Authentication → Users → klik tombol "Add user" → "Create new user"
--
--    USER 1 (Nazir):
--      Email:              nazirxz@money.app
--      Password:           nazir123
--      Auto Confirm User:  CENTANG (✓)
--
--    USER 2 (Richan):
--      Email:              richan@money.app
--      Password:           richan123
--      Auto Confirm User:  CENTANG (✓)
--
-- Selesai. Kembali ke aplikasi → login pakai "nazirxz" / "nazir123"
-- atau "richan" / "richan123" (tanpa @money.app — aplikasi otomatis).
