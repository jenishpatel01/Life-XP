import { useState } from 'react';
import { CARDS, MAX_EQUIPPED, cardById, type Rarity } from '@shared/content.ts';
import { useGame } from '@/lib/store.ts';
import PowerCard, { RARITY_COLOR } from '@/components/PowerCard.tsx';
import { Button, Modal } from '@/components/ui.tsx';

const RARITIES: Rarity[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

export default function Cards() {
  const game = useGame((s) => s.game)!;
  const equip = useGame((s) => s.equipCard);
  const unequip = useGame((s) => s.unequipCard);
  const busy = useGame((s) => s.busy);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | Rarity>('ALL');

  const owned = new Map(game.cards.owned.map((c) => [c.id, c]));
  const equipped = game.cards.equipped;
  const list = CARDS.filter((c) => filter === 'ALL' || c.rarity === filter);
  const sel = open ? cardById(open) : null;
  const selOwned = sel ? owned.get(sel.id) : undefined;
  const isEq = sel ? equipped.includes(sel.id) : false;
  const recharging = (id: string) => !!owned.get(id)?.rechargeUntil && owned.get(id)!.rechargeUntil! > game.today.day;

  return (
    <div data-testid="cards-page">
      <div className="page-head">
        <div>
          <div className="label label--purple">LOADOUT</div>
          <h1 className="page-title h-pixel">POWER CARDS</h1>
          <p className="page-sub">Equip up to {MAX_EQUIPPED} cards. Their effects apply on the server to every quest you complete. {owned.size}/{CARDS.length} collected.</p>
        </div>
      </div>

      <section className="panel panel--purple equip-bar" aria-label="Equipped cards">
        <div className="panel-title"><span className="label label--purple">EQUIPPED ({equipped.length}/{MAX_EQUIPPED})</span></div>
        <div className="equip-slots">
          {Array.from({ length: MAX_EQUIPPED }, (_, i) => {
            const c = equipped[i] ? cardById(equipped[i]) : null;
            return c ? (
              <div key={c.id} className="equip-slot" data-testid={`slot-${i}`}>
                <PowerCard card={c} size="sm" equipped onClick={() => setOpen(c.id)} />
              </div>
            ) : (
              <div key={i} className="equip-slot equip-slot--empty" data-testid={`slot-${i}`}><span>+</span>EMPTY SLOT</div>
            );
          })}
        </div>
      </section>

      <div className="filters">
        <div className="filter-row">
          <button className={`chip ${filter === 'ALL' ? 'is-on' : ''}`} onClick={() => setFilter('ALL')}>All</button>
          {RARITIES.map((r) => <button key={r} className={`chip ${filter === r ? 'is-on' : ''}`} style={filter === r ? undefined : { color: RARITY_COLOR[r] }} onClick={() => setFilter(r)}>{r}</button>)}
        </div>
      </div>

      <div className="card-grid">
        {list.map((c) => (
          <div key={c.id} className="card-cell" data-testid={`card-${c.id}`} data-owned={owned.has(c.id)}>
            <PowerCard card={c} owned={owned.has(c.id)} equipped={equipped.includes(c.id)} recharging={recharging(c.id)} onClick={() => setOpen(c.id)} />
          </div>
        ))}
      </div>

      <Modal open={!!sel} onClose={() => setOpen(null)} label={sel?.name ?? 'Card'}>
        {sel && (
          <div className="card-detail">
            <PowerCard card={sel} owned={!!selOwned} equipped={isEq} size="lg" />
            <div className="card-detail-info">
              <div className="tag" style={{ color: RARITY_COLOR[sel.rarity] }}>{sel.rarity}</div>
              <h2 className="pixel">{selOwned ? sel.name : 'Locked card'}</h2>
              <p className="muted">{selOwned ? sel.description : sel.unlockText}</p>
              {selOwned && <p className="small muted">Unlocked via: {selOwned.source.replace(/_/g, ' ')}</p>}
              {selOwned && recharging(sel.id) && <p className="small orange">Recharging until {selOwned.rechargeUntil}</p>}
              <div className="scene-actions" style={{ justifyContent: 'flex-start' }}>
                {selOwned && (isEq ? (
                  <Button variant="ghost" loading={!!busy[`card:${sel.id}`]} onClick={() => void unequip(sel.id)} data-testid="unequip">Unequip</Button>
                ) : (
                  <Button variant="purple" loading={!!busy[`card:${sel.id}`]} disabled={equipped.length >= MAX_EQUIPPED} onClick={() => void equip(sel.id)} data-testid="equip">Equip</Button>
                ))}
              </div>
              {selOwned && !isEq && equipped.length >= MAX_EQUIPPED && <p className="small muted">All {MAX_EQUIPPED} slots are full. Unequip a card first.</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
