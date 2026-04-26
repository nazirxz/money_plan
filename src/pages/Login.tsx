import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Heart, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const { session, signIn, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(username, password);
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
