import { memo, type CSSProperties } from 'react';
import type { Appearance, ClassId } from '@shared/content.ts';
import { knightURL, KNIGHT_H, KNIGHT_W } from '@/sprites/knight.ts';
import { bossSilhouetteURL, bossURL, BOSS_H, BOSS_W } from '@/sprites/bosses.ts';
import { companionSilhouetteURL, companionURL, COMP_H, COMP_W } from '@/sprites/companion.ts';
import { worldLockedURL, worldURL, WORLD_H, WORLD_W } from '@/sprites/worlds.ts';
import { iconURL, ICON } from '@/sprites/icons.ts';

interface BaseProps {
  /** integer pixel multiplier */
  scale?: number;
  className?: string;
  style?: CSSProperties;
  alt?: string;
}

function Px({ src, w, h, scale = 4, className = '', style, alt = '' }: BaseProps & { src: string; w: number; h: number }) {
  return (
    <img
      src={src}
      alt={alt}
      width={w * scale}
      height={h * scale}
      draggable={false}
      className={`px ${className}`}
      style={{ imageRendering: 'pixelated', maxWidth: '100%', height: 'auto', ...style }}
    />
  );
}

export const HeroSprite = memo(function HeroSprite({ appearance, cls, shadow, ...rest }: BaseProps & { appearance: Appearance; cls: ClassId; shadow?: boolean }) {
  return <Px src={knightURL(appearance, cls, shadow)} w={KNIGHT_W} h={KNIGHT_H} alt="Your hero" {...rest} />;
});

export const BossSprite = memo(function BossSprite({ id, silhouette, ...rest }: BaseProps & { id: string; silhouette?: boolean }) {
  return <Px src={silhouette ? bossSilhouetteURL(id) : bossURL(id)} w={BOSS_W} h={BOSS_H} {...rest} />;
});

export const CompanionSprite = memo(function CompanionSprite({ stage, silhouette, ...rest }: BaseProps & { stage: number; silhouette?: boolean }) {
  return <Px src={silhouette ? companionSilhouetteURL(stage) : companionURL(stage)} w={COMP_W} h={COMP_H} {...rest} />;
});

export const WorldSprite = memo(function WorldSprite({ id, locked, ...rest }: BaseProps & { id: string; locked?: boolean }) {
  return <Px src={locked ? worldLockedURL(id) : worldURL(id)} w={WORLD_W} h={WORLD_H} {...rest} />;
});

export const Icon = memo(function Icon({ id, tint, scale = 2, ...rest }: BaseProps & { id: string; tint?: string }) {
  return <Px src={iconURL(id, tint)} w={ICON} h={ICON} scale={scale} {...rest} />;
});
