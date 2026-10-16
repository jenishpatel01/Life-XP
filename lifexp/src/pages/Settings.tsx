import { useNavigate } from 'react-router-dom';
import { useGame } from '@/lib/store.ts';
import { sfx } from '@/audio/engine.ts';
import { Button } from '@/components/ui.tsx';
import type { Settings as S } from '@shared/types.ts';

function Toggle({ on, onChange, label, id }: { on: boolean; onChange: (v: boolean) => void; label: string; id: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'is-on' : ''}`} onClick={() => onChange(!on)} data-testid={id} data-silent>
      <i />
    </button>
  );
}

function Seg<T extends string>({ value, options, onChange, id }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; id: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={id}>
      {options.map((o) => <button key={o.v} role="radio" aria-checked={value === o.v} className={`chip ${value === o.v ? 'is-on' : ''}`} onClick={() => onChange(o.v)} data-testid={`${id}-${o.v}`}>{o.l}</button>)}
    </div>
  );
}

export default function Settings() {
  const game = useGame((s) => s.game)!;
  const save = useGame((s) => s.saveSettings);
  const logout = useGame((s) => s.logout);
  const nav = useNavigate();
  const s = game.settings;
  const set = (p: Partial<S>) => void save(p);
  return (
    <div data-testid="settings-page">
      <div className="page-head"><div><div className="label">CONFIG</div><h1 className="page-title h-pixel">SETTINGS</h1></div></div>
      <div className="two-col">
        <section className="panel">
          <div className="panel-title"><span className="label">AUDIO</span></div>
          <div className="setting"><div><b>Sound effects</b><p className="muted small">Short UI and game sounds.</p></div><Toggle id="set-sound" label="Sound effects" on={s.sound} onChange={(v) => { set({ sound: v }); if (v) setTimeout(() => sfx.play('notify'), 50); }} /></div>
          <div className="setting"><div><b>Music</b><p className="muted small">Quiet generative chiptune loop. Never starts on its own.</p></div><Toggle id="set-music" label="Music" on={s.music} onChange={(v) => set({ music: v })} /></div>
        </section>
        <section className="panel">
          <div className="panel-title"><span className="label">DISPLAY</span></div>
          <div className="setting"><div><b>Animation intensity</b><p className="muted small">Particles, glow, cursor effects.</p></div><Seg id="set-anim" value={s.animation} onChange={(v) => set({ animation: v })} options={[{ v: 'low', l: 'Low' }, { v: 'medium', l: 'Med' }, { v: 'high', l: 'High' }]} /></div>
          <div className="setting"><div><b>Reduced motion</b><p className="muted small">Auto follows your system setting.</p></div><Seg id="set-motion" value={s.reducedMotion} onChange={(v) => set({ reducedMotion: v })} options={[{ v: 'auto', l: 'Auto' }, { v: 'on', l: 'On' }, { v: 'off', l: 'Off' }]} /></div>
          <div className="setting"><div><b>Theme</b><p className="muted small">Neon or pure-black Void.</p></div><Seg id="set-theme" value={s.theme} onChange={(v) => set({ theme: v })} options={[{ v: 'neon', l: 'Neon' }, { v: 'void', l: 'Void' }]} /></div>
        </section>
        <section className="panel panel--red">
          <div className="panel-title"><span className="label label--red">ACCOUNT</span></div>
          <dl className="kv"><dt>Username</dt><dd>{game.user.username}</dd><dt>Email</dt><dd>{game.user.email}</dd><dt>Timezone</dt><dd>{s.timezone}</dd></dl>
          <Button variant="danger" onClick={async () => { await logout(); nav('/'); }} data-testid="settings-logout">Log out</Button>
        </section>
      </div>
    </div>
  );
}
