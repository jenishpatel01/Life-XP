import { useEffect } from 'react';
import { ATTR_LABEL } from '@shared/content.ts';
import type { Scene } from '@/game/scenes.ts';
import { useGame } from '@/lib/store.ts';
import { sfx } from '@/audio/engine.ts';
import { fx } from '@/fx/fx.ts';
import { useRoll } from '@/hooks/useGame.ts';
import { CompanionSprite, HeroSprite } from './Sprite.tsx';
import { SceneShell } from './SceneShell.tsx';

/** Full-screen level-up celebration (hero, companion, attribute gains, unlocked rewards). */
export default function LevelUpModal({ scene, onDone }: { scene: Extract<Scene, { kind: 'level_up' }>; onDone: () => void }) {
  const game = useGame((s) => s.game);
  const ch = game?.character;
  const lvl = useRoll(scene.level, 700, 600);
  useEffect(() => {
    sfx.play('level_up');
    fx.flash('#fff3b0', 600);
    fx.shake('light');
    const cx = window.innerWidth / 2;
    const ts = [
      window.setTimeout(() => fx.burst(cx, window.innerHeight * 0.4, { colors: ['#ffd23a', '#ffb32e', '#ffffff', '#18d9ff'], count: 90, speed: 9, gravity: 0.1, size: 5 }), 100),
      window.setTimeout(() => fx.burst(cx - 220, window.innerHeight * 0.55, { colors: ['#bd4eff', '#ff4fd8', '#ffffff'], count: 36, speed: 6 }), 700),
      window.setTimeout(() => fx.burst(cx + 220, window.innerHeight * 0.55, { colors: ['#18d9ff', '#48ef9f', '#ffffff'], count: 36, speed: 6 }), 900),
    ];
    return () => ts.forEach(window.clearTimeout);
  }, []);

  return (
    <SceneShell accent="gold" minMs={2000} onDone={onDone} label={`Level up! You reached level ${scene.level}`}>
      <div className="lu">
        <div className="rays" />
        <h2 className="lu-title h-pixel" data-testid="lu-title">LEVEL UP</h2>
        <div className="lu-level num" data-testid="lu-level">LEVEL {lvl}</div>
        <div className="lu-stage">
          {ch && <HeroSprite appearance={ch.appearance} cls={ch.class} scale={9} className="lu-hero glow-pulse" />}
          {game?.companion && <CompanionSprite stage={game.companion.stage} scale={5} className="lu-comp bob-steps" />}
        </div>
        <div className="lu-gains">
          {scene.gains.map((g, i) => (
            <div key={g.attr} className="lu-gain" style={{ animationDelay: `${0.9 + i * 0.18}s` }}>
              <span className="lu-gain-ico">{ATTR_LABEL[g.attr][0]}</span>
              +{g.amount} {ATTR_LABEL[g.attr]}
            </div>
          ))}
        </div>
        {scene.rewards.map((r, i) => (
          <div key={r} className="lu-reward" style={{ animationDelay: `${1.3 + i * 0.2}s` }}>
            ★ {r}
          </div>
        ))}
        <div className="lu-bar"><i /></div>
      </div>
    </SceneShell>
  );
}
