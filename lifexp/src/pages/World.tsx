import { useState } from 'react';
import { Link } from 'react-router-dom';
import { WORLDS, QUESTS, bossById, cardById, worldById } from '@shared/content.ts';
import { useGame } from '@/lib/store.ts';
import { useMediaQuery } from '@/hooks/useGame.ts';
import AnimatedBackground from '@/fx/AnimatedBackground.tsx';
import WorldNode from '@/components/WorldNode.tsx';
import { BossSprite, CompanionSprite, HeroSprite, WorldSprite, Icon } from '@/components/Sprite.tsx';
import { BossHealthBar, Button, LinkButton, Stars } from '@/components/ui.tsx';

export default function World() {
  const game = useGame((s) => s.game)!;
  const ch = game.character!;
  const select = useGame((s) => s.selectWorld);
  const busy = useGame((s) => s.busy);
  const [sel, setSel] = useState(ch.currentWorldId);
  const narrow = useMediaQuery('(max-width: 820px)');

  const def = worldById(sel)!;
  const st = game.worlds.find((w) => w.id === sel)!;
  const boss = bossById(def.bossId)!;
  const quests = QUESTS.filter((q) => q.worldId === sel);
  const doneIds = new Set(game.quests.filter((q) => q.timesCompleted > 0).map((q) => q.id));
  const tried = quests.filter((q) => doneIds.has(q.id)).length;
  const unlockedCount = game.worlds.filter((w) => w.unlocked).length;
  const reqBoss = def.requiresBoss ? bossById(def.requiresBoss) : null;

  const marker = (
    <span className="wnode-marker" aria-hidden>
      <HeroSprite appearance={ch.appearance} cls={ch.class} scale={2} className="bob-steps" />
      {game.companion && <CompanionSprite stage={game.companion.stage} scale={1} className="bob-steps" />}
    </span>
  );

  return (
    <div data-testid="world-page">
      <div className="page-head">
        <div>
          <div className="label">WORLD MAP</div>
          <h1 className="page-title h-pixel">THE REALMS</h1>
          <p className="page-sub">{unlockedCount} of {WORLDS.length} worlds unlocked. Reach the level, defeat the boss, travel on.</p>
        </div>
      </div>

      <div className="world-layout">
        {narrow ? (
          <ol className="world-path" aria-label="Worlds">
            {WORLDS.map((w, i) => (
              <li key={w.id} className={i % 2 ? 'right' : 'left'}>
                <WorldNode world={w} state={game.worlds.find((s) => s.id === w.id)!} current={ch.currentWorldId === w.id} selected={sel === w.id} onSelect={() => setSel(w.id)} marker={ch.currentWorldId === w.id ? marker : undefined} />
              </li>
            ))}
          </ol>
        ) : (
          <div className="world-map panel panel--flat">
            <AnimatedBackground variant="map" className="world-map-bg" sun={false} dim={0.25} />
            <svg className="world-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {WORLDS.slice(1).map((w, i) => {
                const a = WORLDS[i];
                const open = game.worlds.find((s) => s.id === w.id)?.unlocked;
                return <line key={w.id} x1={a.x} y1={a.y} x2={w.x} y2={w.y} className={open ? 'on' : ''} />;
              })}
            </svg>
            {WORLDS.map((w) => (
              <WorldNode key={w.id} world={w} state={game.worlds.find((s) => s.id === w.id)!} current={ch.currentWorldId === w.id} selected={sel === w.id} onSelect={() => setSel(w.id)} marker={ch.currentWorldId === w.id ? marker : undefined} style={{ left: `${w.x}%`, top: `${w.y}%` }} className="wnode--abs" />
            ))}
          </div>
        )}

        <aside className="world-info panel" style={{ ['--wc' as string]: def.color }} data-testid="world-info" aria-live="polite">
          <div className="world-info-head">
            <WorldSprite id={def.id} locked={!st.unlocked} scale={4} />
            <div>
              <div className="label" style={{ color: def.color }}>WORLD {def.order}</div>
              <h2 className="pixel world-info-name" data-testid="world-info-name">{def.name}</h2>
            </div>
          </div>
          <p className="muted">{def.blurb}</p>

          {st.unlocked ? (
            <>
              <div className="world-stat"><span>Progress</span><b className="num">{st.pct}%</b></div>
              <div className="xpbar xpbar--sm xpbar--green"><div className="xpbar-fill" style={{ width: `${st.pct}%` }} /></div>
              <div className="world-stat"><span>Quests tried</span><b className="num">{tried}/{quests.length}</b></div>
              <div className="divider" />
              <div className="label label--red">WORLD BOSS</div>
              <div className="world-boss">
                <BossSprite id={boss.id} silhouette={st.boss.status === 'locked'} scale={2} />
                <div className="grow">
                  <div className="pixel">{boss.name}</div>
                  <Stars n={boss.difficulty} />
                  <div className="small muted">Reward: +{boss.rewardXp} XP · {cardById(boss.rewardCard)?.name}</div>
                </div>
              </div>
              {st.boss.status === 'defeated' ? <div className="tag green">BOSS DEFEATED</div> : <BossHealthBar hp={st.boss.hp} maxHp={st.boss.maxHp} size="sm" />}
              <div className="world-actions">
                {ch.currentWorldId === sel ? (
                  <span className="tag cyan" data-testid="world-here">YOU ARE HERE</span>
                ) : (
                  <Button variant="gold" loading={!!busy[`world:${sel}`]} onClick={() => void select(sel)} data-testid="travel">Travel here</Button>
                )}
                <LinkButton to="/app/quests" variant="ghost" size="sm">View quests</LinkButton>
              </div>
            </>
          ) : (
            <div className="world-locked" data-testid="world-locked">
              <div className="label label--red"><Icon id="lock" scale={2} /> LOCKED</div>
              <ul className="req-list">
                <li className={st.blockers.levelMet ? 'ok' : ''}>{st.blockers.levelMet ? '✓' : '✕'} Reach level {def.levelReq} <span className="muted">(you are {ch.level})</span></li>
                {reqBoss && <li className={st.blockers.bossMet ? 'ok' : ''}>{st.blockers.bossMet ? '✓' : '✕'} Defeat <b>{reqBoss.name}</b></li>}
              </ul>
              {reqBoss && !st.blockers.bossMet && <Link to="/app/bosses" className="link-more">VIEW BOSSES ▸</Link>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
