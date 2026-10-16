import { useEffect } from 'react';
import { useGame } from '@/lib/store.ts';
import { sfx } from '@/audio/engine.ts';
import { fx } from '@/fx/fx.ts';
import type { Toast } from '@/game/scenes.ts';
import { Icon } from './Sprite.tsx';

function ToastItem({ t }: { t: Toast }) {
  const dismiss = useGame((s) => s.dismissToast);
  useEffect(() => {
    if (t.kind === 'achievement') {
      sfx.play('achievement');
      fx.burst(window.innerWidth - 120, 60, { colors: ['#ffb32e', '#fff3b0', '#ffffff'], count: 20, speed: 4 });
    }
    const id = window.setTimeout(() => dismiss(t.id), t.kind === 'achievement' ? 6500 : 5000);
    return () => window.clearTimeout(id);
  }, [t, dismiss]);

  return (
    <div className={`toast toast--${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'} onClick={() => dismiss(t.id)} data-testid={`toast-${t.kind}`}>
      {t.kind === 'achievement' && (
        <div className="toast-icon">
          <Icon id={t.icon ?? 'star'} scale={3} />
        </div>
      )}
      <div>
        {t.kind === 'achievement' && <div className="toast-kicker">ACHIEVEMENT UNLOCKED</div>}
        <div className="toast-title">{t.title}</div>
        {t.body && <div className="toast-body">{t.body}</div>}
      </div>
    </div>
  );
}

export default function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </div>
  );
}
