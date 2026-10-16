import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ACHIEVEMENTS, BOSSES, CARDS, DEFAULT_APPEARANCE, QUESTS, WORLDS } from '@shared/content.ts';
import { useGame } from '@/lib/store.ts';
import { sfx } from '@/audio/engine.ts';
import { fx } from '@/fx/fx.ts';
import AnimatedBackground from '@/fx/AnimatedBackground.tsx';
import TrailerSection from '@/components/TrailerSection.tsx';
import PowerCard from '@/components/PowerCard.tsx';
import { BossSprite, CompanionSprite, HeroSprite, Icon, WorldSprite } from '@/components/Sprite.tsx';
import { BossHealthBar, Button, LinkButton, Logo } from '@/components/ui.tsx';

const LOOP = [
  { icon: 'scroll', t: 'COMPLETE QUESTS', d: 'Real-life actions. Study, train, create, sleep on time.', c: '#18d9ff' },
  { icon: 'star', t: 'EARN XP', d: 'Every quest pays out. Streaks and cards boost it.', c: '#ffb32e' },
  { icon: 'bolt', t: 'LEVEL UP', d: 'Grow your hero and evolve your companion.', c: '#48ef9f' },
  { icon: 'skull', t: 'DEFEAT BOSSES', d: 'Turn procrastination into a health bar. Then break it.', c: '#ff445f' },
];
const FEATURES = [
  { icon: 'scroll', t: 'QUEST SYSTEM', d: `${QUESTS.length} real-world quests across focus, fitness, learning, health, creativity and discipline.` },
  { icon: 'skull', t: 'BOSS BATTLES', d: `${BOSSES.length} bosses with live health bars. Every quest you finish lands a hit.` },
  { icon: 'map', t: 'WORLD MAP', d: `${WORLDS.length} worlds unlock as you level and win. Travel the realms of your own growth.` },
  { icon: 'card', t: 'POWER CARDS', d: `${CARDS.length} collectible cards in four rarities. Equip three to bend the rules.` },
  { icon: 'egg', t: 'COMPANION', d: 'A dragon hatchling that grows with you, from baby to legend.' },
  { icon: 'flame', t: 'KIND STREAKS', d: 'Miss a day? Second Wind brings your streak back. Progress never punishes you.' },
];

function Hero() {
  const user = useGame((s) => s.user);
  return (
    <header className="hero" id="top">
      <AnimatedBackground variant="hero" className="hero-bg" />
      <div className="hero-shade" aria-hidden />
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="label label--purple hero-kicker">16-BIT SELF-IMPROVEMENT RPG</div>
          <h1 className="hero-title h-pixel" data-testid="hero-title">
            <span>YOUR LIFE.</span><span className="c-cyan">YOUR QUESTS.</span><span className="c-orange">YOUR LEVEL.</span>
          </h1>
          <p className="hero-sub">Turn real habits into XP. Fight the bosses that hold you back — procrastination, distraction, the old you — and level up for real.</p>
          <div className="hero-cta">
            {user ? (
              <LinkButton to="/app" variant="primary" size="lg" data-testid="cta-continue">Continue adventure</LinkButton>
            ) : (
              <LinkButton to="/auth?mode=register" variant="primary" size="lg" data-testid="cta-start">Start your quest</LinkButton>
            )}
            <a href="#trailer" className="btn btn--ghost btn--lg magnetic" onClick={(e) => { e.preventDefault(); document.getElementById('trailer')?.scrollIntoView({ behavior: 'smooth' }); }}><span className="btn-face">▶ Watch trailer</span></a>
          </div>
        </div>
        <HeroStage />
      </div>
      <a href="#trailer" className="scroll-cue" aria-label="Scroll to trailer"><span /></a>
    </header>
  );
}

function HeroStage() {
  return (
    <div className="hero-stage" aria-hidden>
      <div className="hero-glow" />
      <div className="hero-hud hero-hud--lv panel panel--flat"><span className="label">LV</span><b className="num orange">12</b><div className="xpbar xpbar--sm"><div className="xpbar-fill" style={{ width: '64%' }} /></div></div>
      <div className="hero-hud hero-hud--q panel panel--flat"><Icon id="check" scale={2} /><span>FOCUS MODE <b className="green">+100 XP</b></span></div>
      <div className="hero-hud hero-hud--s panel panel--flat"><Icon id="flame" scale={2} /><b className="num">7</b><span className="muted">DAY STREAK</span></div>
      <div className="hero-figs">
        <HeroSprite appearance={DEFAULT_APPEARANCE} cls="FOCUS" scale={11} className="hero-knight bob-steps" />
        <CompanionSprite stage={2} scale={6} className="hero-drake bob-steps" />
      </div>
      <div className="hero-pad" />
    </div>
  );
}

function Loop() {
  return (
    <section className="section" id="loop" aria-labelledby="loop-h">
      <div className="container">
        <div className="section-head"><div className="label">THE CORE LOOP</div><h2 id="loop-h" className="section-title h-pixel">PLAY YOUR LIFE</h2></div>
        <ol className="loop">
          {LOOP.map((s, i) => (
            <li key={s.t} className="loop-step panel tilt" data-tilt={6} style={{ ['--lc' as string]: s.c }}>
              <span className="loop-n num">0{i + 1}</span>
              <Icon id={s.icon} scale={5} />
              <h3 className="pixel">{s.t}</h3>
              <p className="muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Playable demo: purely local, never touches the server. */
function Demo() {
  const MAX = 600;
  const [hp, setHp] = useState(MAX);
  const [hit, setHit] = useState(0);
  const [xp, setXp] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const attack = () => {
    if (hp <= 0) { setHp(MAX); setXp(0); return; }
    const crit = Math.random() < 0.2;
    const dmg = (crit ? 2 : 1) * (70 + Math.floor(Math.random() * 50));
    const r = stage.current?.getBoundingClientRect();
    if (r) { fx.floatText(r.left + r.width * 0.5, r.top + r.height * 0.3, `-${dmg}`, crit ? 'crit' : 'dmg'); fx.burst(r.left + r.width * 0.5, r.top + r.height * 0.5, { colors: ['#ff445f', '#ffb32e', '#fff'], count: crit ? 30 : 16, speed: 5 }); }
    if (crit) fx.shake('heavy'); else fx.shake('light');
    sfx.play(crit ? 'boss_crit' : 'boss_hit');
    setHit((h) => h + 1);
    setXp((x) => x + 25);
    const next = Math.max(0, hp - dmg);
    setHp(next);
    if (next === 0) setTimeout(() => sfx.play('boss_defeated'), 250);
  };
  return (
    <section className="section" id="demo" aria-labelledby="demo-h">
      <div className="container demo">
        <div>
          <div className="label label--red">TRY IT</div>
          <h2 id="demo-h" className="section-title h-pixel">HIT THE PROCRASTINATOR</h2>
          <p className="muted">In the real game, damage comes from quests you actually complete — and the server decides the numbers. Here, just feel the hit.</p>
          <div className="demo-xp num orange" aria-live="polite">DEMO XP: {xp}</div>
        </div>
        <div className="demo-arena panel panel--red" ref={stage}>
          <BossHealthBar hp={hp} maxHp={MAX} name="PROCRASTINATION" />
          <div className="demo-boss">
            <div key={hit} className={hp === 0 ? 'demo-down' : hit ? 'demo-hit' : 'bob'}>
              <BossSprite id="procrastination" scale={7} />
            </div>
          </div>
          <Button variant="danger" block onClick={attack} data-testid="demo-attack">{hp <= 0 ? 'Fight again' : 'Attack'}</Button>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="section" id="features" aria-labelledby="feat-h">
      <div className="container">
        <div className="section-head"><div className="label label--purple">EVERYTHING INSIDE</div><h2 id="feat-h" className="section-title h-pixel">A WHOLE GAME</h2></div>
        <div className="feat-grid">
          {FEATURES.map((f) => (
            <article key={f.t} className="feat panel tilt" data-tilt={5} data-energy="#18d9ff">
              <Icon id={f.icon} scale={4} className="feat-ico" />
              <h3 className="pixel">{f.t}</h3>
              <p className="muted">{f.d}</p>
            </article>
          ))}
        </div>
        <div className="feat-cards" aria-label="Sample power cards">
          {['second-wind', 'focus-boost', 'master-plan'].map((id) => { const c = CARDS.find((x) => x.id === id); return c ? <PowerCard key={id} card={c} /> : null; })}
        </div>
      </div>
    </section>
  );
}

function Worlds() {
  return (
    <section className="section" id="worlds" aria-labelledby="worlds-h">
      <div className="container">
        <div className="section-head"><div className="label">SEVEN REALMS</div><h2 id="worlds-h" className="section-title h-pixel">TRAVEL THE MAP</h2></div>
        <div className="worlds-strip">
          {WORLDS.map((w) => (
            <div key={w.id} className="worlds-item" style={{ ['--wc' as string]: w.color }}>
              <WorldSprite id={w.id} scale={3} className="bob" />
              <b className="pixel">{w.name}</b>
              <span className="label">LV {w.levelReq}+</span>
            </div>
          ))}
        </div>
        <p className="muted center">{ACHIEVEMENTS.length} achievements. {QUESTS.length} quests. One life.</p>
      </div>
    </section>
  );
}

function FinalCta() {
  const user = useGame((s) => s.user);
  return (
    <section className="final" aria-labelledby="final-h">
      <AnimatedBackground variant="hero" className="final-bg" sun={false} />
      <div className="hero-shade" aria-hidden />
      <div className="container final-inner">
        <h2 id="final-h" className="hero-title h-pixel">READY TO <span className="c-orange">LEVEL UP?</span></h2>
        <p className="hero-sub">Your first quest is waiting. It takes a minute to create your hero.</p>
        <LinkButton to={user ? '/app' : '/auth?mode=register'} variant="gold" size="lg" data-testid="cta-final">{user ? 'Continue adventure' : 'Create your character'}</LinkButton>
      </div>
    </section>
  );
}

export default function Landing() {
  const user = useGame((s) => s.user);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <div className="landing" data-testid="landing">
      <nav className={`lnav ${scrolled ? 'is-scrolled' : ''}`} aria-label="Primary">
        <div className="container lnav-in">
          <Logo size="sm" to="/" />
          <div className="lnav-links">
            <a href="#trailer">Trailer</a><a href="#features">Features</a><a href="#worlds">Worlds</a>
          </div>
          <div className="lnav-cta">
            {user ? <LinkButton to="/app" size="sm" variant="primary">Play</LinkButton> : (<><Link to="/auth?mode=login" className="lnav-login" data-testid="nav-login">Log in</Link><LinkButton to="/auth?mode=register" size="sm" variant="primary" data-testid="nav-signup">Start</LinkButton></>)}
          </div>
        </div>
      </nav>
      <main>
        <Hero />
        <TrailerSection />
        <Loop />
        <Demo />
        <Features />
        <Worlds />
        <FinalCta />
      </main>
      <footer className="lfoot">
        <div className="container lfoot-in"><Logo size="sm" to={null} /><span className="muted small">Your life. Your quests. Your level.</span></div>
      </footer>
    </div>
  );
}
