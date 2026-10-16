import { classById } from '@shared/content.ts';
import { useGame } from '@/lib/store.ts';
import CharacterCard from '@/components/CharacterCard.tsx';
import { Icon } from '@/components/Sprite.tsx';
import { ACHIEVEMENTS, WORLDS, CARDS } from '@shared/content.ts';

export default function Profile() {
  const game = useGame((s) => s.game)!;
  const ch = game.character!;
  const cls = classById(ch.class)!;
  const since = new Date(game.user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const stats: [string, string | number, string][] = [
    ['trophy', game.stats.totalXp.toLocaleString(), 'TOTAL XP'],
    ['check', game.stats.totalQuests, 'QUESTS DONE'],
    ['skull', game.stats.bossesDefeated, 'BOSSES DEFEATED'],
    ['flame', game.streak.longest, 'BEST STREAK'],
    ['burst', game.stats.crits, 'CRITICAL HITS'],
    ['map', `${game.worlds.filter((w) => w.unlocked).length}/${WORLDS.length}`, 'WORLDS'],
    ['card', `${game.cards.owned.length}/${CARDS.length}`, 'CARDS'],
    ['star', `${game.achievements.length}/${ACHIEVEMENTS.length}`, 'ACHIEVEMENTS'],
  ];
  return (
    <div data-testid="profile-page">
      <div className="page-head">
        <div>
          <div className="label">PLAYER CARD</div>
          <h1 className="page-title h-pixel" data-testid="profile-username">{game.user.username}</h1>
          <p className="page-sub">Adventuring since {since}</p>
        </div>
      </div>
      <div className="two-col">
        <section className="panel">
          <CharacterCard character={ch} companion={game.companion} scale={8} showAttrs={false} />
          <div className="char-sub" style={{ justifyContent: 'center', marginTop: 16 }}><span className="tag" style={{ color: cls.color }}>{cls.name}</span><span className="num">LEVEL {ch.level}</span></div>
        </section>
        <section className="panel">
          <div className="panel-title"><span className="label">LIFETIME STATS</span></div>
          <div className="stat-grid">
            {stats.map(([ic, v, l]) => (
              <div className="tile" key={l}><Icon id={ic} scale={3} /><div><div className="tile-val num">{v}</div><div className="tile-lab">{l}</div></div></div>
            ))}
          </div>
          <div className="divider" />
          <dl className="kv">
            <dt>Email</dt><dd data-testid="profile-email">{game.user.email}</dd>
            <dt>Timezone</dt><dd>{game.settings.timezone}</dd>
          </dl>
        </section>
      </div>
    </div>
  );
}
