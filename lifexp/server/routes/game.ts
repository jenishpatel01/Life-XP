import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { ARMOR_COLORS, HELM_STYLES, PLUME_COLORS } from '../../shared/content.ts';
import { AppError } from '../errors.ts';
import { isValidTimezone } from '../time.ts';
import { getGameState } from '../game/state.ts';
import {
  abandonQuest, completeQuest, createCharacter, equipCard, renameCompanion, selectWorld, startQuest, unequipCard,
} from '../game/engine.ts';

export const gameRouter = Router();

const id = z.string().min(1).max(80).regex(/^[a-z0-9:_-]+$/i);

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) throw new AppError(400, 'VALIDATION', r.error.issues[0]?.message ?? 'Invalid input.');
  return r.data;
}

gameRouter.get('/state', (req, res) => {
  res.json(getGameState(req.userId!));
});

const characterSchema = z.object({
  name: z.string().trim().min(2, 'Hero name must be at least 2 characters.').max(16, 'Hero name can be at most 16 characters.').regex(/^[A-Za-z0-9 _-]+$/, 'Use letters, numbers, spaces, - and _ only.'),
  class: z.enum(['DISCIPLINE', 'FOCUS', 'FITNESS', 'CREATIVE']),
  appearance: z.object({
    armor: z.enum(ARMOR_COLORS.map((a) => a.id) as [string, ...string[]]),
    plume: z.enum(PLUME_COLORS.map((a) => a.id) as [string, ...string[]]),
    helm: z.enum(HELM_STYLES.map((a) => a.id) as [string, ...string[]]),
  }),
});

gameRouter.post('/character', (req, res) => {
  const body = parse(characterSchema, req.body);
  res.status(201).json(createCharacter(req.userId!, body as Parameters<typeof createCharacter>[1]));
});

gameRouter.post('/quests/:id/start', (req, res) => {
  res.json(startQuest(req.userId!, parse(id, req.params.id)));
});
gameRouter.post('/quests/:id/abandon', (req, res) => {
  res.json(abandonQuest(req.userId!, parse(id, req.params.id)));
});
gameRouter.post('/quests/:id/complete', (req, res) => {
  res.json(completeQuest(req.userId!, parse(id, req.params.id)));
});

gameRouter.post('/cards/:id/equip', (req, res) => {
  res.json(equipCard(req.userId!, parse(id, req.params.id)));
});
gameRouter.post('/cards/:id/unequip', (req, res) => {
  res.json(unequipCard(req.userId!, parse(id, req.params.id)));
});

gameRouter.post('/worlds/:id/select', (req, res) => {
  res.json(selectWorld(req.userId!, parse(id, req.params.id)));
});

const companionSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(14, 'Name can be at most 14 characters.').regex(/^[A-Za-z0-9 _-]+$/, 'Use letters, numbers, spaces, - and _ only.'),
});
gameRouter.put('/companion', (req, res) => {
  const { name } = parse(companionSchema, req.body);
  res.json(renameCompanion(req.userId!, name.toUpperCase()));
});

const settingsSchema = z
  .object({
    sound: z.boolean(),
    music: z.boolean(),
    animation: z.enum(['low', 'medium', 'high']),
    reducedMotion: z.enum(['auto', 'on', 'off']),
    theme: z.enum(['neon', 'void']),
    timezone: z.string().max(64).refine(isValidTimezone, 'Unknown timezone.'),
  })
  .partial()
  .strict();

gameRouter.put('/settings', (req, res) => {
  const s = parse(settingsSchema, req.body);
  const map: Record<string, unknown> = {
    sound: s.sound === undefined ? undefined : s.sound ? 1 : 0,
    music: s.music === undefined ? undefined : s.music ? 1 : 0,
    animation: s.animation,
    reduced_motion: s.reducedMotion,
    theme: s.theme,
    timezone: s.timezone,
  };
  const entries = Object.entries(map).filter(([, v]) => v !== undefined);
  if (entries.length) {
    // column names come from the fixed map above, never from user input
    const sql = `UPDATE user_settings SET ${entries.map(([k]) => `${k} = ?`).join(', ')} WHERE user_id = ?`;
    db.prepare(sql).run(...entries.map(([, v]) => v), req.userId!);
  }
  res.json(getGameState(req.userId!));
});
