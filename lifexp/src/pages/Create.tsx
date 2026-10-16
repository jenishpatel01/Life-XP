import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ARMOR_COLORS, BASE_ATTR, CLASSES, HELM_STYLES, PLUME_COLORS, type Appearance, type Attr, type ClassId } from '@shared/content.ts';
import { useGame } from '@/lib/store.ts';
import { ApiError } from '@/lib/api.ts';
import { sfx } from '@/audio/engine.ts';
import { fx } from '@/fx/fx.ts';
import AnimatedBackground from '@/fx/AnimatedBackground.tsx';
import { AttributeBars } from '@/components/CharacterCard.tsx';
import { HeroSprite, Icon } from '@/components/Sprite.tsx';
import { Button, Field } from '@/components/ui.tsx';

const CLASS_ICON: Record<ClassId, string> = { DISCIPLINE: 'shield', FOCUS: 'target', FITNESS: 'bolt', CREATIVE: 'spark' };

export default function Create() {
  const create = useGame((s) => s.createCharacter);
  const loading = useGame((s) => !!s.busy.character);
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [cls, setCls] = useState<ClassId>('FOCUS');
  const [ap, setAp] = useState<Appearance>({ armor: 'azure', plume: 'pink', helm: 'knight' });
  const [err, setErr] = useState('');
  const def = CLASSES.find((c) => c.id === cls)!;
  const attrs = { discipline: BASE_ATTR, focus: BASE_ATTR, fitness: BASE_ATTR, creativity: BASE_ATTR } as Record<Attr, number>;
  for (const [k, n] of Object.entries(def.bonus)) attrs[k as Attr] += n as number;
  const bonus = def.bonus;

  const pickClass = (c: ClassId) => { setCls(c); sfx.play('notify'); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2 || n.length > 16) return setErr('Name must be 2–16 characters.');
    if (!/^[\p{L}\p{N} _-]+$/u.test(n)) return setErr('Letters, numbers, spaces, - and _ only.');
    setErr('');
    try {
      await create({ name: n, class: cls, appearance: ap });
      sfx.play('level_up');
      fx.flash('#ffffff', 400);
      nav('/app', { replace: true });
    } catch (e2) {
      if (e2 instanceof ApiError && e2.fields?.name) setErr(e2.fields.name);
    }
  };

  return (
    <div className="create" data-testid="create">
      <AnimatedBackground variant="world" className="auth-bg" dim={0.2} />
      <div className="hero-shade" aria-hidden />
      <form className="create-wrap" onSubmit={submit} noValidate>
        <header className="create-head">
          <div className="label label--orange">NEW GAME</div>
          <h1 className="page-title h-pixel">CREATE YOUR CHARACTER</h1>
        </header>
        <div className="create-grid">
          <section className="panel create-preview" style={{ ['--cc' as string]: def.color }} aria-label="Preview">
            <div className="char-stage"><div className="char-pad" /><HeroSprite appearance={ap} cls={cls} scale={11} className="char-hero bob-steps" /></div>
            <div className="char-name pixel" data-testid="preview-name">{name.trim() || 'HERO'}</div>
            <div className="char-sub"><span className="tag" style={{ color: def.color }}>{def.name}</span><span className="num">LEVEL 1</span></div>
            <AttributeBars attrs={attrs} previewBonus={bonus} />
          </section>
          <div className="create-fields">
            <section className="panel">
              <Field label="Character name" htmlFor="char-name" error={err}>
                <input id="char-name" className={`input ${err ? 'is-error' : ''}`} value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} maxLength={16} placeholder="Enter a name" autoComplete="off" data-testid="char-name" aria-invalid={!!err} />
              </Field>
            </section>
            <section className="panel" aria-label="Class">
              <div className="label">CHOOSE YOUR CLASS</div>
              <div className="class-grid" role="radiogroup">
                {CLASSES.map((c) => (
                  <button type="button" key={c.id} role="radio" aria-checked={cls === c.id} className={`class-card ${cls === c.id ? 'is-on' : ''}`} style={{ ['--cc' as string]: c.color }} onClick={() => pickClass(c.id)} data-testid={`class-${c.id}`} data-energy={c.color}>
                    <Icon id={CLASS_ICON[c.id]} scale={4} />
                    <b className="pixel">{c.name}</b>
                    <span className="small muted">{c.tagline}</span>
                    <span className="tag green">+3 {c.primary.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="panel" aria-label="Appearance">
              <div className="label">APPEARANCE</div>
              <div className="app-row"><span className="small muted">ARMOR</span><div className="swatches">{ARMOR_COLORS.map((a) => <button type="button" key={a.id} className={`swatch ${ap.armor === a.id ? 'is-on' : ''}`} style={{ background: a.main }} aria-label={`Armor ${a.name}`} aria-pressed={ap.armor === a.id} onClick={() => setAp({ ...ap, armor: a.id })} />)}</div></div>
              <div className="app-row"><span className="small muted">PLUME</span><div className="swatches">{PLUME_COLORS.map((a) => <button type="button" key={a.id} className={`swatch ${ap.plume === a.id ? 'is-on' : ''}`} style={{ background: a.color }} aria-label={`Plume ${a.name}`} aria-pressed={ap.plume === a.id} onClick={() => setAp({ ...ap, plume: a.id })} />)}</div></div>
              <div className="app-row"><span className="small muted">HELM</span><div className="swatches">{HELM_STYLES.map((h) => <button type="button" key={h.id} className={`chip ${ap.helm === h.id ? 'is-on' : ''}`} aria-pressed={ap.helm === h.id} onClick={() => setAp({ ...ap, helm: h.id })}>{h.name}</button>)}</div></div>
            </section>
            <Button type="submit" variant="gold" size="lg" block loading={loading} data-testid="begin">Begin adventure</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
