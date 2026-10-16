import type { AchievementDef } from '@shared/content.ts';
import { Icon } from './Sprite.tsx';

const TIER = { bronze: '#d98a4a', silver: '#c8d4ea', gold: '#ffb32e' } as const;

export default function AchievementCard({ def, unlockedAt, progress, fresh }: { def: AchievementDef; unlockedAt?: string; progress: { cur: number; target: number }; fresh?: boolean }) {
  const unlocked = !!unlockedAt;
  const pct = Math.round((progress.cur / progress.target) * 100);
  return (
    <article className={`ach ${unlocked ? 'is-unlocked' : 'is-locked'} ${fresh ? 'is-fresh' : ''}`} style={{ ['--tier' as string]: TIER[def.tier] }} data-testid={`ach-${def.id}`} data-unlocked={unlocked}>
      <div className="ach-icon">
        <Icon id={unlocked ? def.icon : 'lock'} scale={3} tint={unlocked ? undefined : '#3a3f58'} />
      </div>
      <div className="ach-body">
        <div className="ach-top">
          <h3 className="ach-name">{def.name}</h3>
          <span className="tag ach-tier">{def.tier}</span>
        </div>
        <p className="ach-desc">{def.description}</p>
        {unlocked ? (
          <div className="ach-foot ach-foot--on">UNLOCKED · +{def.rewardXp} XP</div>
        ) : (
          <div className="ach-foot">
            <div className="ach-bar"><i style={{ width: `${pct}%` }} /></div>
            <span>{progress.cur}/{progress.target}</span>
          </div>
        )}
      </div>
    </article>
  );
}
