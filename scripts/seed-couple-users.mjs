/**
 * Mendaftarkan akun pasangan lewat Supabase Admin API.
 * Butuh SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API → service_role).
 * Jangan commit key itu; simpan di .env.local saja.
 *
 * Jalankan dari root proyek: npm run seed:users
 */

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnvFile(name, overwrite) {
  const p = resolve(root, name);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (overwrite || process.env[key] === undefined) process.env[key] = v;
  }
}

loadEnvFile('.env', false);
loadEnvFile('.env.local', true);

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ACCOUNTS = [
  { email: 'nazirxz@money.app', password: 'nazir123' },
  { email: 'richan@money.app', password: 'richan123' },
];

async function main() {
  if (!url || !serviceRole) {
    console.error(
      'Kurang env: VITE_SUPABASE_URL (atau SUPABASE_URL) dan SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Tambahkan SUPABASE_SERVICE_ROLE_KEY di .env.local (jangan commit).'
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const { email, password } of ACCOUNTS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      if (
        msg.includes('already been registered') ||
        msg.includes('already exists') ||
        msg.includes('duplicate')
      ) {
        console.log(`Sudah ada: ${email}`);
        continue;
      }
      console.error(`Gagal ${email}:`, error.message);
      process.exit(1);
    }
    console.log(`Terdaftar: ${email}`, data.user?.id ?? '');
  }

  console.log('\nSelesai. Login di app: nazirxz / nazir123 atau richan / richan123');
}

main();
