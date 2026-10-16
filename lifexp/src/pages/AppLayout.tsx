import { Outlet, useLocation } from 'react-router-dom';
import AnimatedBackground from '@/fx/AnimatedBackground.tsx';
import { BottomNav, Sidebar, TopHUD } from '@/components/GameHUD.tsx';
import EventDirector from '@/components/EventDirector.tsx';

export default function AppLayout() {
  const loc = useLocation();
  return (
    <div className="app" data-testid="app">
      <div className="app-bg" aria-hidden>
        <AnimatedBackground variant="world" dim={0.1} />
        <div className="app-bg-shade" />
      </div>
      <Sidebar />
      <div className="app-main">
        <TopHUD />
        <main className="page" key={loc.pathname}>
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <EventDirector />
    </div>
  );
}
