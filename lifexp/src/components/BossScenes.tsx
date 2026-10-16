import { useEffect, useRef, useState } from 'react';
import { bossById, cardById } from '@shared/content.ts';
import type { Scene } from '@/game/scenes.ts';
import { useGame } from '@/lib/store.ts';
import { sfx } from '@/audio/engine.ts';
import { fx } from '@/fx/fx.ts';
import AnimatedBackground from '@/fx/AnimatedBackground.tsx';
import { useRoll } from '@/hooks/useGame.ts';
import { BossSprite, HeroSprite, Icon } from './Sprite.tsx';
import { BossHealthBar } from './ui.tsx';
import { SceneShell } from './SceneShell.tsx';

/** The strike: hero lunges, boss flashes, screen shakes, damage number, HP bar drains. */
export function BossHitScene({ scene, onDone }: { scene: Extract<Scene, { kind: 'boss_hit' }>; onDone: () => void }) {
  const boss = bossById(scene.bossId)!;
  const ch = useGame((s) => s.game?.character);
  const [hp, setHp] = useState(scene.hpBefore);
  const [hit, setHit] = useState(false);
  const bossRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setHit(true);
      setHp(scene.hpAfter);
      sfx.play(scene.crit ? 'boss_crit' : 'boss_hit');
      fx.shake(scene.crit ? 'heavy' : 'light');
      fx.flash(scene.crit ? '#ffe9a8' : '#ffffff', scene.crit ? 340 : 220);
      const r = bossRef.current?.getBoundingClientRect();
      const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
      const y = r ? r.top + r.height * 0.4 : window.innerHeight / 2;
      fx.burst(x, y, { colors: ['#ff445f', '#ff8a2e', '#ffd23a', '#ffffff'], count: scene.crit ? 70 : 42, speed: scene.crit ? 8 : 6, size: 5, gravity: 0.14 });
      fx.floatText(x, y - 20, `−${scene.damage}`, scene.crit ? 'crit' : 'dmg');
    }, 650);
    return () => window.clearTimeout(t1);
  }, [scene]);

  return (
    <SceneShell accent="red" ms={3100} minMs={900} onDone={onDone} label={`You hit ${boss.name} for ${scene.damage} damage`}>
      <div className="bh">
        <div className="bh-bg"><AnimatedBackground variant="boss" dim={0.25} /></div>
        <div className="bh-top">
          <div className="label label--red">{scene.crit ? 'CRITICAL HIT' : 'BOSS DAMAGED'}</div>
          <div className="bh-hp"><BossHealthBar hp={hp} maxHp={scene.maxHp} name={boss.name} size="lg" /></div>
        </div>
        <div className="bh-arena">
          {ch && (
            <div className="bh-hero">
              <HeroSprite appearance={ch.appearance} cls={ch.class} scale={7} className="bh-hero-img" />
            </div>
          )}
          <div className={`bh-boss ${hit ? 'is-hit' : ''}`} ref={bossRef}>
            <BossSprite id={boss.id} scale={9} className="bh-boss-img" />
            {hit && <div className="bh-slash" />}
          </div>
        </div>
        <div className="bh-dmg num" data-testid="bh-dmg" style={{ opacity: hit ? 1 : 0 }}>
          −{scene.damage} HP
        </div>
      </div>
    </SceneShell>
  );
}

export function BossDefeatedScene({ scene, onDone }: { scene: Extract<Scene, { kind: 'boss_defeated' }>; onDone: () => void }) {
  const boss = bossById(scene.bossId)!;
  const card = cardById(scene.cardId);
  const xp = useRoll(scene.rewardXp, 1200, 900);
  useEffect(() => {
    sfx.play('boss_defeated');
    fx.shake('heavy');
    fx.flash('#ffe9a8', 500);
    const cx = window.innerWidth / 2;
    const t = [
      window.setTimeout(() => fx.burst(cx, window.innerHeight * 0.35, { colors: ['#ffb32e', '#ffd23a', '#ff445f', '#ffffff'], count: 80, speed: 8, gravity: 0.12 }), 150),
      window.setTimeout(() => fx.burst(cx - 160, window.innerHeight * 0.4, { colors: ['#18d9ff', '#bd4eff', '#ffffff'], count: 40, speed: 6 }), 900),
      window.setTimeout(() => fx.burst(cx + 160, window.innerHeight * 0.4, { colors: ['#48ef9f', '#ffb32e', '#ffffff'], count: 40, speed: 6 }), 1200),
    ];
    return () => t.forEach(window.clearTimeout);
  }, []);
  return (
    <SceneShell accent="gold" minMs={1800} onDone={onDone} label={`${boss.name} defeated`}>
      <div className="bd">
        <div className="rays" />
        <div className="bd-boss"><BossSprite id={boss.id} scale={7} className="bd-boss-img" /></div>
        <h2 className="bd-title h-pixel" data-testid="bd-title">BOSS DEFEATED</h2>
        <div className="bd-name pixel">{boss.name}</div>
        <div className="bd-rewards">
          <div className="bd-reward"><Icon id="star" scale={3} /><div><div className="label label--orange">XP</div><div className="num bd-big">+{xp}</div></div></div>
          {card && <div className="bd-reward"><Icon id={card.art} scale={3} /><div><div className="label label--purple">POWER CARD</div><div className="num bd-big">{card.name}</div></div></div>}
          <div className="bd-reward"><Icon id="map" scale={3} /><div><div className="label">WORLD</div><div className="num bd-big">PROGRESS +</div></div></div>
        </div>
      </div>
    </SceneShell>
  );
}
