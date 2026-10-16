import { Link } from 'react-router-dom';
import { ACHIEVEMENTS, BOSSES, CARDS, QUESTS, WORLDS, bossById, worldById, cardById } from '@shared/content.ts';
import { useGame } from '@/lib/store.ts';
import { useCountUp } from '@/hooks/useGame.ts';
import CharacterCard from '@/components/CharacterCard.tsx';
import CompanionCard from '@/components/CompanionCard.tsx';
import QuestCard from '@/components/QuestCard.tsx';
import PowerCard from '@/components/PowerCard.tsx';
import { BossSprite, Icon, WorldSprite } from '@/components/Sprite.tsx';
import { BossHealthBar, EmptyState, LinkButton, Stars, XPBar } from '@/components/ui.tsx';

const DAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Home() {
  const game = useGame((s) => s.game)!;
  const ch = game.character!;
  const totalXp = useCountUp(ch.progress.totalXp);

  const worldState = game.worlds.find((w) => w.id === ch.currentWorldId)!;
  const world = worldById(ch.currentWorldId)!;
  const bossId = game.activeBossId;
  const bossState = bossId ? game.worlds.find((w) => w.boss.id === bossId)?.boss : undefined;
  const boss = bossId ? bossById(bossId) : undefined;

  // today's board: quests from the current world first, then other unlocked worlds
  const unlocked = new Set(game.worlds.filter((w) => w.unlocked).map((w) => w.id));
  const stateOf = (id: string) => game.quests.find((q) => q.id === id)!;
  const board = QUESTS.filter((q) => unlocked.has(q.worldId) && !stateOf(q.id).doneToday).sort((a, b) => {
    const sa = stateOf(a.id).startedAt ? -2 : 0, sb = stateOf(b.id).startedAt ? -2 : 0;
    const wa = a.worldId === ch.currentWorldId ? -1 : 0, wb = b.worldId === ch.currentWorldId ? -1 : 0;
    return sa + wa - (sb + wb);
  });
  const dailyList = board.slice(0, 4);
  const doneToday = game.today.quests;

  const equipped = game.cards.equipped.map((id) => cardById(id)!).filter(Boolean);
  const recent = [...game.achievements].sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt)).slice(0, 3);
  const weekMax = Math.max(1, ...game.streak.week.map((d) => d.count));

  return (
    <div className="home" data-testid="home">
      <section className="panel home-hero" aria-label="Your hero">
        <CharacterCard character={ch} companion={game.companion} scale={7} showAttrs={false} />
        <div className="home-level">
          <div className="label">PLAYER STATUS</div>
          <div className="home-lv h-pixel" data-testid="home-level">LEVEL {ch.level}</div>
          <XPBar xpInto={ch.progress.xpInto} xpNeeded={ch.progress.xpNeeded} size="lg" maxed={ch.progress.maxed} />
          <div className="home-tiles">
            <div className="tile">
              <Icon id="flame" scale={3} />
              <div><div className="tile-val num" data-testid="home-streak">{game.streak.current}<small>{game.streak.current === 1 ? ' day' : ' days'}</small></div><div className="tile-lab">STREAK · BEST {game.streak.longest}</div></div>
            </div>
            <div className="tile">
              <Icon id="star" scale={3} />
              <div><div className="tile-val num" data-testid="home-daily-xp">+{game.today.xp}</div><div className="tile-lab">DAILY XP</div></div>
            </div>
            <div className="tile">
              <Icon id="check" scale={3} />
              <div><div className="tile-val num">{doneToday}</div><div className="tile-lab">QUESTS TODAY</div></div>
            </div>
            <div className="tile">
              <Icon id="trophy" scale={3} />
              <div><div className="tile-val num">{totalXp.toLocaleString()}</div><div className="tile-lab">TOTAL XP</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel home-quests" aria-label="Daily quests">
        <div className="panel-title">
          <span className="label"><Icon id="scroll" scale={2} /> DAILY QUESTS</span>
          <Link to="/app/quests" className="link-more">ALL QUESTS ▸</Link>
        </div>
        {dailyList.length === 0 ? (
          <EmptyState title="QUEST BOARD EMPTY" body="New quests arrive tomorrow. Rest up, hero." art={<Icon id="scroll" scale={5} tint="#3a3f58" />} />
        ) : (
          <div className="quest-list">
            {dailyList.map((q) => (
              <QuestCard key={q.id} quest={q} state={stateOf(q.id)} minSeconds={game.minQuestSeconds} compact worldLabel={q.worldId === ch.currentWorldId ? undefined : worldById(q.worldId)?.name} />
            ))}
          </div>
        )}
      </section>

      <section className="panel panel--red home-boss" aria-label="Active boss">
        <div className="panel-title"><span className="label label--red"><Icon id="skull" scale={2} /> ACTIVE BOSS</span></div>
        {boss && bossState ? (
          <>
            <div className="home-boss-stage">
              <BossSprite id={boss.id} scale={5} className="bob glow-pulse" style={{ ['--glow' as string]: 'rgba(255,68,95,.6)' }} />
            </div>
            <div className="home-boss-name pixel" data-testid="home-boss-name">{boss.name}</div>
            <BossHealthBar hp={bossState.hp} maxHp={bossState.maxHp} />
            <div className="home-boss-meta"><Stars n={boss.difficulty} /><span className="muted">Reward: +{boss.rewardXp} XP · {cardById(boss.rewardCard)?.name}</span></div>
            <LinkButton to="/app/quests" variant="danger" size="sm" block>Attack with quests</LinkButton>
          </>
        ) : (
          <EmptyState title="ALL BOSSES DOWN" body="Every boss in reach has been defeated. Unlock the next world to find more." art={<Icon id="crown" scale={5} />} />
        )}
      </section>

      <section className="panel panel--gold home-comp" aria-label="Companion">
        {game.companion && <CompanionCard companion={game.companion} />}
      </section>

      <section className="panel panel--purple home-cards" aria-label="Equipped power cards">
        <div className="panel-title">
          <span className="label label--purple"><Icon id="card" scale={2} /> POWER CARDS</span>
          <Link to="/app/cards" className="link-more">COLLECTION ▸</Link>
        </div>
        <div className="home-card-row">
          {[0, 1, 2].map((i) =>
            equipped[i] ? (
              <PowerCard key={equipped[i].id} card={equipped[i]} size="sm" equipped />
            ) : (
              <Link key={i} to="/app/cards" className="card-slot-empty">
                <span>+</span>EMPTY SLOT
              </Link>
            ),
          )}
        </div>
        <div className="muted home-card-note">{CARDS.length - game.cards.owned.length} cards left to discover</div>
      </section>

      <section className="panel home-world" aria-label="Current world">
        <div className="panel-title"><span className="label"><Icon id="map" scale={2} /> CURRENT WORLD</span><Link to="/app/world" className="link-more">WORLD MAP ▸</Link></div>
        <div className="home-world-body">
          <WorldSprite id={world.id} scale={4} className="bob" />
          <div className="grow">
            <div className="home-world-name pixel" data-testid="home-world">{world.name}</div>
            <div className="muted">{world.blurb}</div>
            <div className="home-world-pct">
              <div className="xpbar xpbar--sm xpbar--green"><div className="xpbar-fill" style={{ width: `${worldState.pct}%` }} /></div>
              <span className="num">{worldState.pct}% COMPLETE</span>
            </div>
            <div className="muted small">{worldState.questsDone}/{worldState.questsTotal} quests tried · {game.worlds.filter((w) => w.unlocked).length}/{WORLDS.length} worlds unlocked</div>
          </div>
        </div>
      </section>

      <section className="panel home-week" aria-label="Weekly activity">
        <div className="panel-title"><span className="label"><Icon id="wave" scale={2} /> THIS WEEK</span></div>
        <div className="week">
          {game.streak.week.map((d) => {
            const dow = new Date(d.day + 'T00:00:00Z').getUTCDay();
            return (
              <div key={d.day} className={`week-day ${d.day === game.today.day ? 'is-today' : ''}`} title={`${d.day}: ${d.count} quest${d.count === 1 ? '' : 's'}`}>
                <div className="week-bar"><i style={{ height: `${(d.count / weekMax) * 100}%` }} /></div>
                <span>{DAY_LETTER[dow]}</span>
                <b className="num">{d.count}</b>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel panel--gold home-ach" aria-label="Recent achievements">
        <div className="panel-title"><span className="label label--orange"><Icon id="trophy" scale={2} /> ACHIEVEMENTS</span><Link to="/app/achievements" className="link-more">{game.achievements.length}/{ACHIEVEMENTS.length} ▸</Link></div>
        {recent.length === 0 ? (
          <div className="muted">Complete your first quest to unlock <b className="orange">FIRST QUEST</b>.</div>
        ) : (
          <div className="home-ach-list">
            {recent.map((r) => {
              const def = ACHIEVEMENTS.find((a) => a.id === r.id)!;
              return (
                <div key={r.id} className="home-ach-item"><Icon id={def.icon} scale={3} /><div><div className="pixel">{def.name}</div><div className="muted small">{def.description}</div></div></div>
              );
            })}
          </div>
        )}
      </section>
      <span hidden>{BOSSES.length}</span>
    </div>
  );
}
