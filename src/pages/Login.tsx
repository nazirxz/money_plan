import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Heart, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const REMEMBER_PREF_KEY = 'mp_login_remember_me';

function readRememberDefault(): boolean {
  try {
    return localStorage.getItem(REMEMBER_PREF_KEY) !== '0';
  } catch {
    return true;
  }
}

export default function Login() {
  const { session, signIn, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(readRememberDefault);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(username, password, rememberMe);
    setSubmitting(false);
    if (error) setError(error);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-pink-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-card">
            <Wallet className="h-7 w-7" />
            <div className="absolute -right-1.5 -bottom-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-soft">
              <Heart className="h-3 w-3" fill="currentColor" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Money Planner</h1>
          <p className="text-center text-sm text-zinc-500">
            Atur keuangan berdua, lebih ringan.
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-500">Username</label>
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="input mt-1"
                placeholder="nazirxz / richan"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Password</label>
              <input
                type="password"
                required
                className="input mt-1"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => {
                  const v = e.target.checked;
                  setRememberMe(v);
                  try {
                    localStorage.setItem(REMEMBER_PREF_KEY, v ? '1' : '0');
                  } catch {
                    /* private mode */
                  }
                }}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs leading-snug text-zinc-600">
                <span className="font-medium text-zinc-800">Ingat saya</span>
                <span className="mt-0.5 block text-zinc-500">
                  Matikan jika perangkat dipakai bersama — sesi tidak disimpan setelah menutup
                  browser.
                </span>
              </span>
            </label>

            {error && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error.includes('Invalid login')
                  ? 'Username atau password salah'
                  : error}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Akses terbatas — hanya untuk Nazir & Richan.
        </p>
      </div>
    </div>
  );
}
