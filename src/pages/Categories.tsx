import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import Modal from '@/components/Modal';
import { COLOR_PALETTE, ICON_NAMES, getIcon } from '@/lib/icons';
import { classNames } from '@/lib/utils';
import type { TxType } from '@/lib/types';

export default function Categories() {
  const { categories, loading, create, remove } = useCategories();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<TxType>('expense');
  const [icon, setIcon] = useState('tag');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = {
    income: categories.filter((c) => c.type === 'income'),
    expense: categories.filter((c) => c.type === 'expense'),
  };

  function reset() {
    setName('');
    setType('expense');
    setIcon('tag');
    setColor(COLOR_PALETTE[0]);
    setError(null);
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Nama kategori wajib diisi');
      return;
    }
    setSubmitting(true);
    const { error } = await create({ name: name.trim(), type, icon, color });
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    reset();
    setOpen(false);
  }

  async function handleDelete(id: string, n: string) {
    if (!confirm(`Hapus kategori "${n}"? Transaksi terkait tidak akan terhapus.`)) return;
    await remove(id);
  }

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Kategori</h1>
        <button
          onClick={() => {
            reset();
            setOpen(true);
          }}
          className="btn-primary px-4 py-2"
        >
          <Plus className="h-4 w-4" /> Tambah
        </button>
      </div>

      {loading ? (
        <div className="mt-6 card p-8 text-center text-sm text-zinc-500">Memuat...</div>
      ) : (
        <div className="mt-6 space-y-6">
          <Section
            title="Pemasukan"
            list={grouped.income}
            onDelete={handleDelete}
          />
          <Section
            title="Pengeluaran"
            list={grouped.expense}
            onDelete={handleDelete}
          />
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Tambah Kategori">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1">
          {(['expense', 'income'] as TxType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={classNames(
                'rounded-xl py-2.5 text-sm font-semibold transition',
                type === t
                  ? t === 'expense'
                    ? 'bg-rose-500 text-white shadow-soft'
                    : 'bg-brand-600 text-white shadow-soft'
                  : 'text-zinc-600'
              )}
            >
              {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-zinc-500">Nama</label>
          <input
            className="input mt-1"
            placeholder="cth. Listrik"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
          />
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-zinc-500">Warna</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={c}
                className={classNames(
                  'h-8 w-8 rounded-full border-2 transition',
                  color === c ? 'border-zinc-900 scale-110' : 'border-white shadow-soft'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-zinc-500">Ikon</label>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {ICON_NAMES.map((n) => {
              const Icon = getIcon(n);
              const active = icon === n;
              return (
                <button
                  key={n}
                  onClick={() => setIcon(n)}
                  className={classNames(
                    'flex h-11 items-center justify-center rounded-xl border transition',
                    active
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary mt-5 w-full"
        >
          {submitting ? 'Menyimpan...' : 'Simpan'}
        </button>
      </Modal>
    </div>
  );
}

function Section({
  title,
  list,
  onDelete,
}: {
  title: string;
  list: { id: string; name: string; icon: string; color: string }[];
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      {list.length === 0 ? (
        <div className="card p-5 text-center text-sm text-zinc-500">
          Belum ada kategori.
        </div>
      ) : (
        <div className="card divide-y divide-zinc-100 p-1">
          {list.map((c) => {
            const Icon = getIcon(c.icon);
            return (
              <div
                key={c.id}
                className="group flex items-center gap-3 px-3 py-2.5"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: c.color }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1 text-sm font-medium text-zinc-900">
                  {c.name}
                </span>
                <button
                  onClick={() => onDelete(c.id, c.name)}
                  className="rounded-full p-2 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Hapus ${c.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
