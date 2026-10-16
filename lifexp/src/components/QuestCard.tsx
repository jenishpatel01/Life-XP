import { ATTR_LABEL, type QuestDef } from '@shared/content.ts';
import type { QuestStateDTO } from '@shared/types.ts';
import { CATEGORY_COLOR } from '@/game/progress.ts';
import { useServerNow } from '@/hooks/useGame.ts';
import { useGame } from '@/lib/store.ts';
import { Button, Stars } from './ui.tsx';
import { Icon } from './Sprite.tsx';

const CAT_ICON: Record<string, string> = { FOCUS: 'target', FITNESS: 'bolt', LEARNING: 'book', HEALTH: 'heart', CREATIVITY: 'spark', DISCIPLINE: 'shield' };

interface Props {
  quest: QuestDef;
  state: QuestStateDTO;
  locked?: boolean;
  minSeconds: number;
  worldLabel?: string;
  /** accelerate = show boss damage / compact layout flags */
  compact?: boolean;
}

function fmtClock(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function QuestCard({ quest, state, locked, minSeconds, worldLabel, compact }: Props) {
  const start = useGame((s) => s.startQuest);
  const complete = useGame((s) => s.completeQuest);
  const abandon = useGame((s) => s.abandonQuest);
  const busy = useGame((s) => !!s.busy[`quest:${quest.id}`]);
  const started = state.startedAt !== null;
  const now = useServerNow(250, started);
  const elapsed = started ? (now - (state.startedAt as number)) / 1000 : 0;
  const ready = started && elapsed >= minSeconds;
  const color = CATEGORY_COLOR[quest.category];
  const done = state.doneToday;

  const status = locked ? 'locked' : done ? 'done' : started ? 'active' : 'idle';

  return (
    <article className={`quest-card quest-card--${status} ${compact ? 'quest-card--compact' : ''}`} style={{ ['--qc' as string]: color }} data-energy={locked || done ? undefined : color} data-testid={`quest-${quest.id}`} data-status={status}>
      <div className="quest-icon">
        <Icon id={locked ? 'lock' : done ? 'check' : CAT_ICON[quest.category]} scale={3} />
      </div>
      <div className="quest-main">
        <div className="quest-meta">
          <span className="tag" style={{ color }}>{quest.category}</span>
          {worldLabel && <span className="quest-world">{worldLabel}</span>}
          {quest.minutes ? <span className="quest-world">~{quest.minutes >= 60 ? `${quest.minutes / 60}h` : `${quest.minutes}m`}</span> : null}
        </div>
        <h3 className="quest-title">{quest.title}</h3>
        <p className="quest-desc">{quest.description}</p>
        <div className="quest-rewards">
          <Stars n={quest.difficulty} />
          <span className="reward reward--xp">+{quest.xp} XP</span>
          <span className="reward reward--boss">−{quest.bossDamage} BOSS HP</span>
          <span className="reward reward--attr">+{quest.attrAmount} {ATTR_LABEL[quest.attr]}</span>
        </div>
      </div>
      <div className="quest-action">
        {locked && <span className="quest-status quest-status--locked">LOCKED</span>}
        {!locked && done && (
          <span className="quest-status quest-status--done">
            <Icon id="check" scale={2} /> DONE TODAY
          </span>
        )}
        {!locked && !done && !started && (
          <Button size="sm" variant="primary" loading={busy} onClick={() => void start(quest.id).catch(() => undefined)} data-testid={`start-${quest.id}`}>
            Start quest
          </Button>
        )}
        {!locked && !done && started && (
          <div className="quest-run">
            <div className="quest-timer" aria-live="off">{fmtClock(elapsed)}</div>
            <Button size="sm" variant={ready ? 'gold' : 'dark'} disabled={!ready} loading={busy} onClick={() => void complete(quest.id).catch(() => undefined)} data-testid={`complete-${quest.id}`}>
              {ready ? 'Complete quest' : `Claim in ${Math.max(1, Math.ceil(minSeconds - elapsed))}s`}
            </Button>
            <button className="quest-abandon" onClick={() => void abandon(quest.id)} disabled={busy}>
              cancel
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
