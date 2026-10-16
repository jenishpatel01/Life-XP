import { useState } from 'react';
import { ACHIEVEMENTS } from '@shared/content.ts';
import { useGame } from '@/lib/store.ts';
import { achievementProgress } from '@/game/progress.ts';
import AchievementCard from '@/components/AchievementCard.tsx';

export default function Achievements() {
  const game = useGame((s) => s.game)!;
  const [f, setF] = useState<'all' | 'unlocked' | 'locked'>('all');
  const got = new Map(game.achievements.map((a) => [a.id, a.unlockedAt]));
  const list = ACHIEVEMENTS.filter((a) => f === 'all' || (f === 'unlocked') === got.has(a.id));
  const pct = Math.round((got.size / ACHIEVEMENTS.length) * 100);
  return (
    <div data-testid="achievements-page">
      <div className="page-head">
        <div>
          <div className="label label--orange">TROPHY ROOM</div>
          <h1 className="page-title h-pixel">ACHIEVEMENTS</h1>
          <p className="page-sub"><span data-testid="ach-count" className="num orange">{got.size}/{ACHIEVEMENTS.length}</span> unlocked ({pct}%). Each one pays out bonus XP.</p>
        </div>
        <div className="filter-row">
          {(['all', 'unlocked', 'locked'] as const).map((k) => <button key={k} className={`chip ${f === k ? 'is-on' : ''}`} onClick={() => setF(k)}>{k}</button>)}
        </div>
      </div>
      <div className="ach-grid">
        {list.map((a) => <AchievementCard key={a.id} def={a} unlockedAt={got.get(a.id)} progress={achievementProgress(a, game)} />)}
      </div>
    </div>
  );
}
