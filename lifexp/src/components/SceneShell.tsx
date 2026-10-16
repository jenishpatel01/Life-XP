import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useGame } from '@/lib/store.ts';

export type Accent = 'cyan' | 'gold' | 'red' | 'pink' | 'green';

interface ShellProps {
  children: ReactNode;
  accent?: Accent;
  /** auto-advance after this many ms (0 = wait for the player) */
  ms?: number;
  /** ignore taps for this long so a celebration can't be skipped by accident */
  minMs?: number;
  onDone: () => void;
  label: string;
  /** hide the tap-to-continue footer (when the scene has its own buttons) */
  noHint?: boolean;
}

export function SceneShell({ children, accent = 'cyan', ms = 0, minMs = 700, onDone, label, noHint }: ShellProps) {
  const [ready, setReady] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;
  const skip = useGame((s) => s.skipScenes);
  useEffect(() => {
    const a = window.setTimeout(() => setReady(true), minMs);
    const b = ms ? window.setTimeout(() => done.current(), ms) : 0;
    return () => { window.clearTimeout(a); if (b) window.clearTimeout(b); };
  }, [ms, minMs]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['Enter', ' ', 'Escape'].includes(e.key) && ready) { e.preventDefault(); done.current(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready]);

  return (
    <div className={`scene scene--${accent}`} role="dialog" aria-label={label} aria-live="assertive" onClick={() => ready && done.current()} data-testid="scene">
      <div className="scene-bg" />
      <button className="scene-skip" data-silent data-testid="skip-scenes" onClick={(e) => { e.stopPropagation(); skip(); }}>
        SKIP ALL ▸▸
      </button>
      {children}
      {!noHint && ready && <div className="scene-hint">TAP TO CONTINUE</div>}
    </div>
  );
}
