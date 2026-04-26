import { AlertTriangle } from 'lucide-react';

export default function ConfigError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-lg font-bold text-zinc-900">
          Konfigurasi belum lengkap
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Variabel <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">VITE_SUPABASE_URL</code>{' '}
          dan{' '}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">VITE_SUPABASE_ANON_KEY</code>{' '}
          belum tersedia saat build.
        </p>

        <div className="mt-5 rounded-2xl bg-zinc-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Cara perbaiki di Vercel
          </p>
          <ol className="mt-2 list-inside list-decimal space-y-1.5 text-sm text-zinc-700">
            <li>Buka project di Vercel Dashboard</li>
            <li>
              Settings → <span className="font-medium">Environment Variables</span>
            </li>
            <li>
              Tambahkan kedua variabel di atas (Production, Preview, Development)
            </li>
            <li>
              Deployments → klik titik tiga di deploy terbaru →{' '}
              <span className="font-medium">Redeploy</span>
            </li>
          </ol>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Nilainya bisa kamu copy dari file <code>.env</code> lokal.
        </p>
      </div>
    </div>
  );
}
