import { LogOut, Mail, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { emailToUsername, getDisplayName } from '@/lib/users';

export default function Settings() {
  const { user, signOut } = useAuth();
  const displayName = getDisplayName(user?.email);
  const username = emailToUsername(user?.email);

  return (
    <div className="px-5 pt-7">
      <h1 className="text-xl font-bold text-zinc-900">Profil</h1>

      <div className="mt-6 card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <span className="text-lg font-bold uppercase">
              {(displayName || '?').charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">{displayName}</p>
            <p className="truncate text-xs text-zinc-500">@{username}</p>
            <p className="text-xs text-zinc-500">
              Bergabung{' '}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 card divide-y divide-zinc-100">
        <Row icon={<Mail className="h-4 w-4" />} label="Email login" value={user?.email ?? '-'} />
        <Row
          icon={<Shield className="h-4 w-4" />}
          label="Penyimpanan"
          value="Supabase (terenkripsi)"
        />
      </div>

      <button
        onClick={() => {
          if (confirm('Keluar dari akun?')) signOut();
        }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" /> Keluar
      </button>

      <p className="mt-8 text-center text-xs text-zinc-400">
        Money Planner · v0.1.0
      </p>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="truncate text-sm font-medium text-zinc-900">{value}</p>
      </div>
    </div>
  );
}
