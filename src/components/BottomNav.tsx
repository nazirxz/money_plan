import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, ListOrdered, Plus, Tag, Settings } from 'lucide-react';
import { useState } from 'react';
import AddTransactionModal from './AddTransactionModal';
import { classNames } from '@/lib/utils';

const items = [
  { to: '/', label: 'Beranda', icon: Home },
  { to: '/transaksi', label: 'Transaksi', icon: ListOrdered },
  { to: '/kategori', label: 'Kategori', icon: Tag },
  { to: '/pengaturan', label: 'Profil', icon: Settings },
];

export default function BottomNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthRoute = location.pathname === '/login';
  if (isAuthRoute) return null;

  return (
    <>
      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 md:max-w-lg">
        <div className="safe-bottom mx-3 mb-3 rounded-3xl border border-zinc-200/70 bg-white/95 px-2 pt-2 shadow-card backdrop-blur">
          <div className="grid grid-cols-5 items-center">
            {items.slice(0, 2).map(({ to, label, icon: Icon }) => (
              <NavItem key={to} to={to} label={label} Icon={Icon} />
            ))}
            <div className="flex justify-center">
              <button
                aria-label="Tambah transaksi"
                onClick={() => setOpen(true)}
                className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition active:scale-95 hover:bg-brand-700"
              >
                <Plus className="h-6 w-6" strokeWidth={2.5} />
              </button>
            </div>
            {items.slice(2).map(({ to, label, icon: Icon }) => (
              <NavItem key={to} to={to} label={label} Icon={Icon} />
            ))}
          </div>
        </div>
      </nav>

      <AddTransactionModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          navigate('/transaksi');
        }}
      />
    </>
  );
}

function NavItem({
  to,
  label,
  Icon,
}: {
  to: string;
  label: string;
  Icon: typeof Home;
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        classNames(
          'flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-medium transition',
          isActive ? 'text-brand-600' : 'text-zinc-500 hover:text-zinc-800'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={classNames('h-5 w-5', isActive && 'stroke-[2.4]')}
            strokeWidth={isActive ? 2.4 : 2}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
