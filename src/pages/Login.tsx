import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const { session, signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error } = await fn(email, password);
    setSubmitting(false);
    if (error) setError(error);
    else if (mode === 'signup')
      setInfo('Akun dibuat. Cek email untuk konfirmasi (jika diaktifkan), lalu masuk.');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-zinc-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-card">
            <Wallet className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Money Planner</h1>
          <p className="text-center text-sm text-zinc-500">
            Atur pemasukan & pengeluaran kamu dengan rapi.
          </p>
        </div>

        <div className="card p-6">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={
                mode === 'signin'
                  ? 'rounded-xl bg-white py-2 text-sm font-semibold text-zinc-900 shadow-soft'
                  : 'rounded-xl py-2 text-sm font-medium text-zinc-500'
              }
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={
                mode === 'signup'
                  ? 'rounded-xl bg-white py-2 text-sm font-semibold text-zinc-900 shadow-soft'
                  : 'rounded-xl py-2 text-sm font-medium text-zinc-500'
              }
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-500">Email</label>
              <input
                type="email"
                required
                className="input mt-1"
                placeholder="kamu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="input mt-1"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
            )}
            {info && (
              <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700">{info}</p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Memproses...' : mode === 'signin' ? 'Masuk' : 'Daftar'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Data kamu tersimpan aman di Supabase.
        </p>
      </div>
    </div>
  );
}
