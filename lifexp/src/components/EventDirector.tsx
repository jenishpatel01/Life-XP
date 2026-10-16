import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ATTR_LABEL, CARDS, COMPANION_STAGES, cardById, worldById, MAX_EQUIPPED } from '@shared/content.ts';
import { useGame } from '@/lib/store.ts';
import { sfx } from '@/audio/engine.ts';
import { fx } from '@/fx/fx.ts';
import { useRoll } from '@/hooks/useGame.ts';
import type { Scene } from '@/game/scenes.ts';
import { Button } from './ui.tsx';
import { Icon, CompanionSprite, WorldSprite } from './Sprite.tsx';
import PowerCard from './PowerCard.tsx';
import { BossDefeatedScene, BossHitScene } from './BossScenes.tsx';
import { SceneShell } from './SceneShell.tsx';
import LevelUpModal from './LevelUpModal.tsx';

function QuestScene({ scene, onDone }: { scene: Extract<Scene, { kind: 'quest' }>; onDone: () => void }) {
  const xp = useRoll(scene.xp, 800, 250);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    sfx.play('quest');
    const t = window.setTimeout(() => sfx.play('xp'), 260);
    const r = ref.current?.getBoundingClientRect();
    const cx = r ? r.left + r.width / 2 : window.innerWidth / 2, cy = r ? r.top + r.height / 2 : window.innerHeight / 2;
    fx.burst(cx, cy, { colors: ['#48ef9f', '#18d9ff', '#ffb32e', '#ffffff'], count: 36, speed: 5.5, size: 5 });
    return () => window.clearTimeout(t);
  }, []);
  return (
    <SceneShell accent="green" ms={2600} minMs={500} onDone={onDone} label="Quest complete">
      <div className="qc" ref={ref}>
        <div className="qc-card">
          <div className="qc-check"><Icon id="check" scale={4} /></div>
          <div className="label label--green">QUEST COMPLETE</div>
          <h2 className="qc-title pixel">{scene.title}</h2>
          <div className="qc-xp num" data-testid="qc-xp">+{xp} XP</div>
          {scene.breakdown.length > 0 && (
            <div className="qc-break">
              {scene.breakdown.map((b, i) => (
                <span key={i}>{b.label} +{b.pct}%</span>
              ))}
            </div>
          )}
          <div className="qc-attrs">
            {scene.attrs.map((a, i) => (
              <span key={i} className="qc-attr" style={{ animationDelay: `${0.5 + i * 0.15}s` }}>
                {ATTR_LABEL[a.attr]} +{a.amount}
              </span>
            ))}
            {scene.streak && scene.streak.current > 1 && (
              <span className="qc-attr qc-attr--streak" style={{ animationDelay: '0.7s' }}>
                <Icon id="flame" scale={2} /> {scene.streak.current}-DAY STREAK{scene.streak.saved ? ' · SECOND WIND!' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

function WorldScene({ scene, onDone }: { scene: Extract<Scene, { kind: 'world' }>; onDone: () => void }) {
  const w = worldById(scene.worldId)!;
  const nav = useNavigate();
  useEffect(() => {
    sfx.play('world');
    fx.flash('#7ff6ff', 420);
    fx.burst(window.innerWidth / 2, window.innerHeight / 2, { colors: [w.color, '#ffffff', '#18d9ff'], count: 50, speed: 6 });
  }, [w.color]);
  return (
    <SceneShell accent="cyan" minMs={900} onDone={onDone} label={`New world unlocked: ${w.name}`} noHint>
      <div className="wu">
        <div className="wu-ring" style={{ borderColor: w.color }} />
        <div className="wu-ring wu-ring--2" style={{ borderColor: w.color }} />
        <div className="label">NEW WORLD UNLOCKED</div>
        <div className="wu-island glow-pulse" style={{ ['--glow' as string]: w.color }}>
          <WorldSprite id={w.id} scale={9} />
        </div>
        <h2 className="wu-name h-pixel" data-testid="wu-name">{w.name}</h2>
        <p className="wu-blurb">{w.blurb}</p>
        <div className="scene-actions" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" onClick={onDone}>Continue</Button>
          <Button onClick={() => { onDone(); nav('/app/world'); }}>View world map</Button>
        </div>
      </div>
    </SceneShell>
  );
}

function CardScene({ scene, onDone }: { scene: Extract<Scene, { kind: 'card' }>; onDone: () => void }) {
  const card = cardById(scene.cardId)!;
  const [flipped, setFlipped] = useState(true);
  const equip = useGame((s) => s.equipCard);
  const equipped = useGame((s) => s.game?.cards.equipped ?? []);
  const free = equipped.length < MAX_EQUIPPED;
  useEffect(() => {
    const t = window.setTimeout(() => { setFlipped(false); sfx.play('card'); fx.burst(window.innerWidth / 2, window.innerHeight / 2 - 40, { colors: ['#ffffff', '#bd4eff', '#18d9ff', '#ffb32e'], count: 40, speed: 5 }); }, 500);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <SceneShell accent={card.rarity === 'LEGENDARY' ? 'gold' : 'pink'} minMs={1400} onDone={onDone} label={`New power card: ${card.name}`} noHint>
      <div className="cs">
        <div className="label label--purple">NEW POWER CARD</div>
        <div className="cs-card"><PowerCard card={card} flipped={flipped} size="lg" /></div>
        <div className="cs-how">{card.unlockText}</div>
        <div className="scene-actions" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" onClick={onDone}>Continue</Button>
          {free && !equipped.includes(card.id) && (
            <Button variant="purple" onClick={() => { void equip(card.id).then(onDone).catch(() => undefined); }}>Equip now</Button>
          )}
        </div>
      </div>
    </SceneShell>
  );
}

function EvolveScene({ scene, onDone }: { scene: Extract<Scene, { kind: 'evolve' }>; onDone: () => void }) {
  const [phase, setPhase] = useState<0 | 1>(0);
  useEffect(() => {
    sfx.play('evolve');
    fx.flash('#ffffff', 1200);
    const t = window.setTimeout(() => { setPhase(1); fx.shake('heavy'); fx.burst(window.innerWidth / 2, window.innerHeight / 2, { colors: ['#ffffff', '#ffd23a', '#ff8a2e', '#18d9ff'], count: 70, speed: 7 }); }, 1500);
    return () => window.clearTimeout(t);
  }, []);
  const stage = COMPANION_STAGES.find((s) => s.stage === scene.stage)!;
  return (
    <SceneShell accent="gold" minMs={2600} onDone={onDone} label={`${scene.name} evolved`}>
      <div className="ev">
        <div className="rays" />
        <div className="label label--orange">{scene.name} IS EVOLVING</div>
        <div className={`ev-sprite ${phase === 1 ? 'is-new' : 'is-old'}`}>
          {phase === 0 ? <CompanionSprite stage={scene.stage - 1} scale={9} silhouette className="ev-flicker" /> : <CompanionSprite stage={scene.stage} scale={10} className="bob" />}
        </div>
        <h2 className="ev-title h-pixel" style={{ opacity: phase === 1 ? 1 : 0 }}>{stage.title}</h2>
        <div className="ev-path" style={{ opacity: phase === 1 ? 1 : 0 }}>
          {COMPANION_STAGES.map((s) => (
            <span key={s.key} className={s.stage === scene.stage ? 'on' : s.stage < scene.stage ? 'past' : ''}>{s.key}</span>
          ))}
        </div>
      </div>
    </SceneShell>
  );
}

/** Plays the queue of celebration scenes, one at a time. */
export default function EventDirector() {
  const scene = useGame((s) => s.scenes[0]);
  const next = useGame((s) => s.nextScene);
  const keyRef = useRef(new WeakMap<Scene, number>());
  const seq = useRef(0);
  if (!scene) return null;
  let k = keyRef.current.get(scene);
  if (k === undefined) { k = ++seq.current; keyRef.current.set(scene, k); }

  switch (scene.kind) {
    case 'quest': return <QuestScene key={k} scene={scene} onDone={next} />;
    case 'boss_hit': return <BossHitScene key={k} scene={scene} onDone={next} />;
    case 'boss_defeated': return <BossDefeatedScene key={k} scene={scene} onDone={next} />;
    case 'level_up': return <LevelUpModal key={k} scene={scene} onDone={next} />;
    case 'world': return <WorldScene key={k} scene={scene} onDone={next} />;
    case 'card': return <CardScene key={k} scene={scene} onDone={next} />;
    case 'evolve': return <EvolveScene key={k} scene={scene} onDone={next} />;
  }
}

export { CARDS };
