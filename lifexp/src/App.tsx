import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useGame } from '@/lib/store.ts';
import { sfx } from '@/audio/engine.ts';
import { syncMusic } from '@/audio/engine.ts';
import { usePrefs } from '@/lib/prefs.ts';
import CursorEffects from '@/fx/CursorEffects.tsx';
import Toasts from '@/components/Toasts.tsx';
import AppLayout from '@/pages/AppLayout.tsx';
import Landing from '@/pages/Landing.tsx';
import Auth from '@/pages/Auth.tsx';
import Create from '@/pages/Create.tsx';
import Home from '@/pages/Home.tsx';
import { Skeleton } from '@/components/ui.tsx';

const Quests = lazy(() => import('@/pages/Quests.tsx'));
const World = lazy(() => import('@/pages/World.tsx'));
const Bosses = lazy(() => import('@/pages/Bosses.tsx'));
const Cards = lazy(() => import('@/pages/Cards.tsx'));
const Character = lazy(() => import('@/pages/Character.tsx'));
const Achievements = lazy(() => import('@/pages/Achievements.tsx'));
const Profile = lazy(() => import('@/pages/Profile.tsx'));
const Settings = lazy(() => import('@/pages/Settings.tsx'));
const SpriteLab = import.meta.env.DEV ? lazy(() => import('@/pages/SpriteLab.tsx')) : null;

function Boot() {
  return <div className="boot" role="status" aria-label="Loading"><span className="boot-mark pixel">LIFE//XP</span><div className="boot-bar"><i /></div></div>;
}

/** Signed in + character → game. Otherwise send to the right step. */
function RequireGame() {
  const user = useGame((s) => s.user);
  const game = useGame((s) => s.game);
  if (!user || !game) return <Navigate to="/auth?mode=login" replace />;
  if (!game.character) return <Navigate to="/create" replace />;
  return <AppLayout />;
}

function RequireNoCharacter() {
  const user = useGame((s) => s.user);
  const game = useGame((s) => s.game);
  if (!user || !game) return <Navigate to="/auth?mode=register" replace />;
  if (game.character) return <Navigate to="/app" replace />;
  return <Outlet />;
}

function Fallback() {
  return <div className="page"><Skeleton h={80} /><div style={{ height: 14 }} /><Skeleton h={220} /></div>;
}

export default function App() {
  const boot = useGame((s) => s.boot);
  const init = useGame((s) => s.init);
  const music = usePrefs((s) => s.music);

  useEffect(() => { void init(); }, [init]);
  useEffect(() => { syncMusic(); }, [music]);

  // one delegated click sound for every interactive control (opt out with data-silent)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('button,[role="button"],a.btn,.nav-link,.bn-link,.chip');
      if (!el || el.hasAttribute('data-silent') || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return;
      sfx.play('click');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  if (boot === 'loading') return <Boot />;

  return (
    <BrowserRouter>
      <CursorEffects />
      <Toasts />
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route element={<RequireNoCharacter />}>
            <Route path="/create" element={<Create />} />
          </Route>
          <Route path="/app" element={<RequireGame />}>
            <Route index element={<Home />} />
            <Route path="quests" element={<Quests />} />
            <Route path="world" element={<World />} />
            <Route path="bosses" element={<Bosses />} />
            <Route path="cards" element={<Cards />} />
            <Route path="character" element={<Character />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          {SpriteLab && <Route path="/__sprites" element={<SpriteLab />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
