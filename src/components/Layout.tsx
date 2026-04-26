import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="min-h-full bg-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-zinc-50 sm:shadow-card sm:my-0 md:max-w-lg">
        <main className="flex-1 pb-28">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
