import { BOSSES, cardById, worldById } from '@shared/content.ts';
import { useGame } from '@/lib/store.ts';
import { BossSprite, Icon } from '@/components/Sprite.tsx';
import { BossHealthBar, LinkButton, Stars } from '@/components/ui.tsx';

export default function Bosses() {
  const game = useGame((s) => s.game)!;
  const states = new Map(game.worlds.map((w) => [w.boss.id, w.boss]));
  const defeated = [...states.values()].filter((b) => b.status === 'defeated').length;

  return (
    <div data-testid="bosses-page">
      <div className="page-head">
        <div>
          <div className="label label--red">BOSS ARENA</div>
          <h1 className="page-title h-pixel">BOSSES</h1>
          <p className="page-sub">Every boss is a bad habit given a body. Quests from its world deal damage. {defeated}/{BOSSES.length} defeated.</p>
        </div>
      </div>
      <div className="boss-grid">
        {BOSSES.map((b) => {
          const s = states.get(b.id)!;
          const active = game.activeBossId === b.id;
          const w = worldById(b.worldId)!;
          return (
            <article key={b.id} className={`boss-card panel panel--red ${s.status === 'locked' ? 'is-locked' : ''} ${s.status === 'defeated' ? 'is-defeated' : ''} ${active ? 'is-active' : ''}`} data-testid={`boss-${b.id}`} data-status={s.status}>
              <div className="boss-card-stage">
                <BossSprite id={b.id} silhouette={s.status === 'locked'} scale={5} className={s.status === 'active' ? 'bob' : ''} />
                {s.status === 'defeated' && <span className="boss-x">DEFEATED</span>}
                {s.status === 'locked' && <span className="boss-lock"><Icon id="lock" scale={4} /></span>}
              </div>
              <div className="boss-card-body">
                <div className="label label--red">{w.name}</div>
                <h3 className="pixel boss-card-name">{s.status === 'locked' ? '???' : b.name}</h3>
                <Stars n={b.difficulty} />
                <p className="muted small">{s.status === 'locked' ? `Unlocks with ${w.name}.` : b.blurb}</p>
                {s.status !== 'locked' && <BossHealthBar hp={s.hp} maxHp={s.maxHp} size="sm" />}
                <div className="boss-rewards small">
                  <span className="reward reward--xp">+{b.rewardXp} XP</span>
                  <span className="reward reward--attr">{s.status === 'locked' ? 'CARD ???' : cardById(b.rewardCard)?.name}</span>
                </div>
                {s.status === 'active' && <LinkButton to="/app/quests" variant="danger" size="sm" block>Attack with quests</LinkButton>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
