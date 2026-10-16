import type { CardDef } from '@shared/content.ts';
import { Icon } from './Sprite.tsx';

export const RARITY_COLOR = { COMMON: '#9fb0c7', RARE: '#3d9bff', EPIC: '#bd4eff', LEGENDARY: '#ffb32e' } as const;

interface Props {
  card: CardDef;
  owned?: boolean;
  equipped?: boolean;
  recharging?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  /** render the card back (used for flip reveals) */
  flipped?: boolean;
  tilt?: boolean;
}

export function CardFront({ card, owned = true, equipped, recharging }: Pick<Props, 'card' | 'owned' | 'equipped' | 'recharging'>) {
  const color = RARITY_COLOR[card.rarity];
  return (
    <div className={`pcard-face pcard-front pcard--${card.rarity.toLowerCase()} ${owned ? '' : 'is-locked'}`} style={{ ['--rc' as string]: color }}>
      <div className="pcard-top">
        <span className="pcard-rarity">{card.rarity}</span>
        <span className="pcard-gems" aria-hidden>
          {Array.from({ length: { COMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4 }[card.rarity] }, () => '◆').join('')}
        </span>
      </div>
      <div className="pcard-art">
        <div className="pcard-art-bg" />
        {owned ? <Icon id={card.art} scale={7} className="pcard-icon" /> : <Icon id="lock" scale={6} className="pcard-icon" />}
      </div>
      <div className="pcard-name">{owned ? card.name : '? ? ?'}</div>
      <div className="pcard-effect">{owned ? card.description : card.unlockText}</div>
      {equipped && <div className="pcard-badge">EQUIPPED</div>}
      {recharging && <div className="pcard-badge pcard-badge--dim">RECHARGING</div>}
      {owned && <div className="pcard-foil" aria-hidden />}
    </div>
  );
}

export default function PowerCard({ card, owned = true, equipped, recharging, onClick, size = 'md', flipped, tilt = true }: Props) {
  const inner = (
    <div className={`pcard-flip ${flipped ? 'is-flipped' : ''}`}>
      <CardFront card={card} owned={owned} equipped={equipped} recharging={recharging} />
      <div className="pcard-face pcard-back" aria-hidden>
        <div className="pcard-back-mark">L//X</div>
      </div>
    </div>
  );
  const common = `pcard pcard--${size} ${tilt ? 'tilt' : ''} ${owned ? '' : 'pcard--locked'}`;
  return onClick ? (
    <button className={common} onClick={onClick} data-tilt={10} aria-label={`${card.name}, ${card.rarity} power card${owned ? '' : ', locked'}`} data-energy={RARITY_COLOR[card.rarity]}>
      {inner}
    </button>
  ) : (
    <div className={common} data-tilt={10}>
      {inner}
    </div>
  );
}
