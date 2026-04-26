import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function cleanEnv(s: string | undefined): string | undefined {
  if (s == null || s === '') return undefined;
  let v = String(s).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v || undefined;
}

const url = cleanEnv(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const anonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

export const isSupabaseConfigured = Boolean(url && anonKey);

if (import.meta.env.DEV && url && anonKey) {
  const parts = anonKey.split('.');
  if (parts.length !== 3) {
    console.error(
      '[Money Planner] VITE_SUPABASE_ANON_KEY tidak terlihat seperti JWT (3 segmen). ' +
        'Cek .env, lalu restart `npm run dev`.'
    );
  }
}

/** Kunci sesi auth yang dipakai @supabase/supabase-js untuk URL proyek ini. */
function authStorageKey(supabaseUrl: string): string {
  try {
    const ref = new URL(supabaseUrl).hostname.split('.')[0];
    return `sb-${ref}-auth-token`;
  } catch {
    return 'sb-auth-token';
  }
}

/** Pilih storage yang sudah berisi sesi (setelah refresh), default localStorage. */
function initialAuthStorage(): Storage {
  if (!url || !anonKey) return localStorage;
  const key = authStorageKey(url);
  if (localStorage.getItem(key)) return localStorage;
  if (sessionStorage.getItem(key)) return sessionStorage;
  return localStorage;
}

function createWithStorage(storage: Storage): SupabaseClient {
  return createClient(url ?? 'https://placeholder.supabase.co', anonKey ?? 'placeholder-anon-key', {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export let supabase: SupabaseClient = createWithStorage(initialAuthStorage());

/**
 * Pindahkan klien auth ke localStorage (tetap masuk) atau sessionStorage (sesi per tab/browser).
 * Harus dipanggil sebelum `signInWithPassword` agar token tersimpan di tempat yang benar.
 */
export function replaceSupabaseAuthStorage(usePersistentSession: boolean) {
  const storage = usePersistentSession ? localStorage : sessionStorage;
  supabase = createWithStorage(storage);
}
