// Dev-only page (route /__sprites) for reviewing generated pixel art.
import { ARMOR_COLORS, BOSSES, CLASSES, HELM_STYLES, PLUME_COLORS, WORLDS } from '@shared/content.ts';
import { BossSprite, CompanionSprite, HeroSprite, Icon, WorldSprite } from '@/components/Sprite.tsx';
import { ICON_IDS } from '@/sprites/icons.ts';

export default function SpriteLab() {
  return (
    <div style={{ padding: 24, background: '#0b0d19', minHeight: '100vh', color: '#fff', fontFamily: 'monospace' }}>
      <h3>HEROES</h3>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {HELM_STYLES.map((h) => (
          <HeroSprite key={h.id} appearance={{ armor: 'azure', plume: 'pink', helm: h.id }} cls="FOCUS" scale={6} />
        ))}
        {CLASSES.map((c, i) => (
          <HeroSprite key={c.id} appearance={{ armor: ARMOR_COLORS[i].id, plume: PLUME_COLORS[i].id, helm: 'knight' }} cls={c.id} scale={6} />
        ))}
        {ARMOR_COLORS.map((a) => (
          <HeroSprite key={a.id} appearance={{ armor: a.id, plume: 'gold', helm: 'crown' }} cls="DISCIPLINE" scale={4} />
        ))}
      </div>
      <h3>BOSSES</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {BOSSES.map((b) => (
          <div key={b.id} style={{ background: '#1a0b1f', padding: 8 }}>
            <BossSprite id={b.id} scale={5} />
            <div style={{ fontSize: 10 }}>{b.name}</div>
          </div>
        ))}
      </div>
      <h3>COMPANION (stages 1-4) + silhouette</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {[1, 2, 3, 4].map((s) => <CompanionSprite key={s} stage={s} scale={6} />)}
        <CompanionSprite stage={2} silhouette scale={6} />
      </div>
      <h3>WORLDS</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {WORLDS.map((w) => <WorldSprite key={w.id} id={w.id} scale={4} />)}
        {WORLDS.slice(0, 3).map((w) => <WorldSprite key={'l' + w.id} id={w.id} locked scale={4} />)}
      </div>
      <h3>ICONS</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {ICON_IDS.map((id) => (
          <div key={id} style={{ textAlign: 'center', fontSize: 9 }}>
            <Icon id={id} scale={5} />
            <div>{id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
