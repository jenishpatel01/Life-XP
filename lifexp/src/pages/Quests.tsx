import { useMemo, useState } from 'react';
import { CATEGORIES, QUESTS, WORLDS, bossById } from '@shared/content.ts';
import { useGame } from '@/lib/store.ts';
import { CATEGORY_COLOR } from '@/game/progress.ts';
import QuestCard from '@/components/QuestCard.tsx';
import { EmptyState, Skeleton } from '@/components/ui.tsx';
import { Icon } from '@/components/Sprite.tsx';

type Status = 'all' | 'todo' | 'done';

export default function Quests() {
  const game = useGame((s) => s.game);
  const [cat, setCat] = useState<string>('ALL');
  const [status, setStatus] = useState<Status>('all');
  const [worldFilter, setWorldFilter] = useState<string>('ALL');

  const stateOf = useMemo(() => new Map((game?.quests ?? []).map((q) => [q.id, q])), [game?.quests]);

  if (!game) return <div className="quest-list">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={110} />)}</div>;

  const unlocked = new Set(game.worlds.filter((w) => w.unlocked).map((w) => w.id));
  const filtered = QUESTS.filter((q) => {
    const st = stateOf.get(q.id);
    if (!st) return false;
    if (cat !== 'ALL' && q.category !== cat) return false;
    if (worldFilter !== 'ALL' && q.worldId !== worldFilter) return false;
    if (status === 'done' && !st.doneToday) return false;
    if (status === 'todo' && (st.doneToday || !unlocked.has(q.worldId))) return false;
    return true;
  });
  const groups = WORLDS.map((w) => ({ w, list: filtered.filter((q) => q.worldId === w.id) })).filter((g) => g.list.length);
  const doneToday = game.today.quests;

  return (
    <div data-testid="quests-page">
      <div className="page-head">
        <div>
          <div className="label">QUEST LOG</div>
          <h1 className="page-title h-pixel">QUESTS</h1>
          <p className="page-sub">Real-life actions, real rewards. Start a quest, do the thing, then claim it. Every completed quest damages the boss of its world.</p>
        </div>
        <div className="quest-summary panel panel--flat">
          <span className="num green" data-testid="quests-done-today">{doneToday}</span>
          <span className="label">DONE TODAY</span>
          <span className="num orange">+{game.today.xp} XP</span>
        </div>
      </div>

      <div className="filters" role="group" aria-label="Filter quests">
        <div className="filter-row">
          <button className={`chip ${status === 'all' ? 'is-on' : ''}`} onClick={() => setStatus('all')}>All</button>
          <button className={`chip ${status === 'todo' ? 'is-on' : ''}`} onClick={() => setStatus('todo')} data-testid="filter-todo">Available</button>
          <button className={`chip ${status === 'done' ? 'is-on' : ''}`} onClick={() => setStatus('done')}>Done today</button>
        </div>
        <div className="filter-row">
          <button className={`chip ${cat === 'ALL' ? 'is-on' : ''}`} onClick={() => setCat('ALL')}>Every type</button>
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip ${cat === c ? 'is-on' : ''}`} style={cat === c ? undefined : { color: CATEGORY_COLOR[c] }} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="filter-row">
          <select className="input select" aria-label="Filter by world" value={worldFilter} onChange={(e) => setWorldFilter(e.target.value)}>
            <option value="ALL">All worlds</option>
            {WORLDS.map((w) => <option key={w.id} value={w.id} disabled={!unlocked.has(w.id)}>{w.name}{unlocked.has(w.id) ? '' : ' (locked)'}</option>)}
          </select>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState title="NO QUESTS HERE" body="Nothing matches these filters. Try a different category or status." art={<Icon id="scroll" scale={5} tint="#3a3f58" />} />
      ) : (
        groups.map(({ w, list }) => {
          const open = unlocked.has(w.id);
          return (
            <section key={w.id} className="quest-group" aria-label={w.name}>
              <h2 className="quest-group-head pixel">
                <span style={{ color: open ? w.color : undefined }} className={open ? '' : 'muted'}>{w.name}</span>
                {!open && <span className="tag muted"><Icon id="lock" scale={1} /> LOCKED</span>}
              </h2>
              {open ? (
                <div className="quest-list">
                  {list.map((q) => <QuestCard key={q.id} quest={q} state={stateOf.get(q.id)!} minSeconds={game.minQuestSeconds} />)}
                </div>
              ) : (
                <div className="quest-locked panel panel--flat" data-testid={`locked-${w.id}`}>
                  <Icon id="lock" scale={3} tint="#4a4e68" />
                  <div>
                    <b className="pixel">{list.length} QUESTS WAITING</b>
                    <p className="muted small">Reach level {w.levelReq}{w.requiresBoss ? <> and defeat <b>{bossById(w.requiresBoss)?.name}</b></> : null} to unlock this world.</p>
                  </div>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
