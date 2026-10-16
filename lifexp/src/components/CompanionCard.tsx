import { COMPANION_STAGES, companionStageForLevel } from '@shared/content.ts';
import type { CompanionDTO } from '@shared/types.ts';
import { CompanionSprite } from './Sprite.tsx';
import { XPBar } from './ui.tsx';

export default function CompanionCard({ companion, compact }: { companion: CompanionDTO; compact?: boolean }) {
  const stage = companionStageForLevel(companion.level);
  const next = COMPANION_STAGES.find((s) => s.minLevel > companion.level);
  return (
    <div className={`companion ${compact ? 'companion--compact' : ''}`} data-testid="companion-card">
      <div className="companion-stage">
        <div className="companion-pad" />
        <CompanionSprite stage={companion.stage} scale={compact ? 4 : 6} className="bob-steps companion-sprite" alt={companion.name} />
      </div>
      <div className="companion-info">
        <div className="label label--orange">COMPANION</div>
        <div className="companion-name pixel">{companion.name}</div>
        <div className="companion-sub">
          <span className="num">LEVEL {companion.level}</span> · <span className="orange">{stage.key}</span>
        </div>
        <XPBar xpInto={companion.progress.xpInto} xpNeeded={companion.progress.xpNeeded} size="sm" variant="green" showText={!compact} />
        {!compact && (
          <div className="companion-next">
            {next ? <>Evolves at <b>LEVEL {next.minLevel}</b> → {next.key}</> : <>Fully evolved. A true legend.</>}
          </div>
        )}
      </div>
    </div>
  );
}
