import { useState } from 'react';
import { COMPANION_STAGES, classById } from '@shared/content.ts';
import { useGame } from '@/lib/store.ts';
import CharacterCard, { AttributeBars } from '@/components/CharacterCard.tsx';
import CompanionCard from '@/components/CompanionCard.tsx';
import { CompanionSprite } from '@/components/Sprite.tsx';
import { Button, Field, XPBar } from '@/components/ui.tsx';

export default function Character() {
  const game = useGame((s) => s.game)!;
  const rename = useGame((s) => s.renameCompanion);
  const busy = useGame((s) => !!s.busy.companion);
  const ch = game.character!;
  const comp = game.companion!;
  const cls = classById(ch.class)!;
  const [name, setName] = useState(comp.name);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2 || n.length > 16) return setErr('Use 2–16 characters.');
    if (!/^[\p{L}\p{N} _-]+$/u.test(n)) return setErr('Letters, numbers, spaces, - and _ only.');
    setErr('');
    try { await rename(n); } catch { /* toasted */ }
  };

  return (
    <div data-testid="character-page">
      <div className="page-head">
        <div>
          <div className="label">YOUR HERO</div>
          <h1 className="page-title h-pixel">{ch.name}</h1>
          <p className="page-sub" style={{ color: cls.color }}>{cls.name} CLASS — {cls.tagline}</p>
        </div>
      </div>
      <div className="two-col">
        <section className="panel">
          <CharacterCard character={ch} companion={comp} scale={8} />
          <div className="divider" />
          <XPBar xpInto={ch.progress.xpInto} xpNeeded={ch.progress.xpNeeded} variant="rainbow" maxed={ch.progress.maxed} />
          <p className="small muted" style={{ marginTop: 10 }}>Each level-up grants +1 {cls.primary} and +1 to the attribute of the quest you finished.</p>
        </section>
        <div className="stack">
          <section className="panel">
            <div className="panel-title"><span className="label">ATTRIBUTES</span></div>
            <AttributeBars attrs={ch.attrs} />
          </section>
          <section className="panel panel--gold">
            <CompanionCard companion={comp} />
            <form className="rename" onSubmit={submit} noValidate>
              <Field label="Rename companion" htmlFor="comp-name" error={err}>
                <input id="comp-name" className={`input ${err ? 'is-error' : ''}`} value={name} maxLength={16} onChange={(e) => setName(e.target.value)} data-testid="comp-name" />
              </Field>
              <Button variant="gold" size="sm" loading={busy} disabled={name.trim() === comp.name}>Save name</Button>
            </form>
          </section>
        </div>
      </div>

      <section className="panel panel--gold evo" aria-label="Companion evolution">
        <div className="panel-title"><span className="label label--orange">EVOLUTION PATH</span></div>
        <ol className="evo-line">
          {COMPANION_STAGES.map((s) => {
            const reached = comp.stage >= s.stage;
            return (
              <li key={s.stage} className={`evo-step ${reached ? 'is-reached' : ''} ${comp.stage === s.stage ? 'is-current' : ''}`} data-testid={`evo-${s.stage}`}>
                <CompanionSprite stage={s.stage} silhouette={!reached} scale={4} />
                <b className="pixel">{reached ? s.title : '???'}</b>
                <span className="label">{s.key} · LV {s.minLevel}</span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
