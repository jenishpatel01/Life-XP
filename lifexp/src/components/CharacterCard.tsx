import { ATTRS, ATTR_LABEL, classById, type Attr } from '@shared/content.ts';
import type { CharacterDTO, CompanionDTO } from '@shared/types.ts';
import { CompanionSprite, HeroSprite } from './Sprite.tsx';

const ATTR_COLOR: Record<Attr, string> = { discipline: '#bd4eff', focus: '#18d9ff', fitness: '#48ef9f', creativity: '#ffb32e' };

export function AttributeBars({ attrs, previewBonus }: { attrs: Record<Attr, number>; previewBonus?: Partial<Record<Attr, number>> }) {
  const max = Math.max(20, ...ATTRS.map((a) => attrs[a])) + 4;
  return (
    <div className="attrs" data-testid="attrs">
      {ATTRS.map((a) => (
        <div key={a} className="attr" style={{ ['--ac' as string]: ATTR_COLOR[a] }}>
          <div className="attr-top">
            <span className="attr-name">{ATTR_LABEL[a]}</span>
            <span className="attr-val num" data-testid={`attr-${a}`}>
              {attrs[a]}
              {previewBonus?.[a] ? <em> +{previewBonus[a]}</em> : null}
            </span>
          </div>
          <div className="attr-bar"><i style={{ width: `${(attrs[a] / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

/** Hero on a glowing platform with their companion. */
export default function CharacterCard({ character, companion, scale = 7, showAttrs = true }: { character: CharacterDTO; companion?: CompanionDTO | null; scale?: number; showAttrs?: boolean }) {
  const cls = classById(character.class)!;
  return (
    <div className="char-card" data-testid="character-card" style={{ ['--cc' as string]: cls.color }}>
      <div className="char-stage">
        <div className="char-pad" />
        <HeroSprite appearance={character.appearance} cls={character.class} scale={scale} className="char-hero bob-steps" alt={character.name} />
        {companion && <CompanionSprite stage={companion.stage} scale={Math.max(3, scale - 3)} className="char-comp bob-steps" alt={companion.name} />}
      </div>
      <div className="char-info">
        <div className="char-name pixel">{character.name}</div>
        <div className="char-sub"><span className="tag" style={{ color: cls.color }}>{cls.name}</span><span className="num">LEVEL {character.level}</span></div>
        {showAttrs && <AttributeBars attrs={character.attrs} />}
      </div>
    </div>
  );
}
