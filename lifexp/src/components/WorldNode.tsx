import type { WorldDef } from '@shared/content.ts';
import type { WorldStateDTO } from '@shared/types.ts';
import { WorldSprite, Icon } from './Sprite.tsx';

interface Props {
  world: WorldDef;
  state: WorldStateDTO;
  current: boolean;
  selected: boolean;
  onSelect: () => void;
  marker?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

/** One island on the world map. */
export default function WorldNode({ world, state, current, selected, onSelect, marker, style, className = '' }: Props) {
  const done = state.boss.status === 'defeated';
  return (
    <button
      className={`wnode ${state.unlocked ? 'is-open' : 'is-locked'} ${selected ? 'is-selected' : ''} ${current ? 'is-current' : ''} ${done ? 'is-done' : ''} ${className}`}
      style={{ ['--wc' as string]: world.color, ...style }}
      onClick={onSelect}
      data-testid={`world-${world.id}`}
      data-unlocked={state.unlocked}
      aria-pressed={selected}
      aria-label={`${world.name}${state.unlocked ? '' : ', locked'}`}
      data-energy={world.color}
    >
      {marker}
      <span className="wnode-art">
        <WorldSprite id={world.id} locked={!state.unlocked} scale={3} className={state.unlocked ? 'wnode-sprite' : 'wnode-sprite is-locked'} />
        {!state.unlocked && <span className="wnode-lock"><Icon id="lock" scale={3} /></span>}
        {done && <span className="wnode-flag"><Icon id="flag" scale={2} /></span>}
      </span>
      <span className="wnode-name">{world.name}</span>
      <span className="wnode-sub">{state.unlocked ? `${state.pct}%` : `LV ${world.levelReq}`}</span>
    </button>
  );
}
