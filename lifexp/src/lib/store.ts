import { create } from 'zustand';
import type { Appearance, ClassId } from '@shared/content.ts';
import { achievementById } from '@shared/content.ts';
import type { CompleteQuestResponse, GameState, Settings } from '@shared/types.ts';
import { api, ApiError, setUnauthorizedHandler } from './api.ts';
import { usePrefs } from './prefs.ts';
import { buildScenes, type Scene, type Toast } from '@/game/scenes.ts';
import { sfx } from '@/audio/engine.ts';

interface GameStore {
  boot: 'loading' | 'ready';
  user: { username: string; email: string } | null;
  game: GameState | null;
  scenes: Scene[];
  toasts: Toast[];
  busy: Record<string, boolean>;
  /** serverTime - clientTime, so quest timers agree with the server clock */
  skew: number;

  init: () => Promise<void>;
  register: (v: { username: string; email: string; password: string; confirmPassword: string }) => Promise<void>;
  login: (v: { identifier: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  createCharacter: (v: { name: string; class: ClassId; appearance: Appearance }) => Promise<void>;
  startQuest: (id: string) => Promise<void>;
  abandonQuest: (id: string) => Promise<void>;
  completeQuest: (id: string) => Promise<void>;
  equipCard: (id: string) => Promise<void>;
  unequipCard: (id: string) => Promise<void>;
  selectWorld: (id: string) => Promise<void>;
  renameCompanion: (name: string) => Promise<void>;
  saveSettings: (patch: Partial<Settings>) => Promise<void>;

  nextScene: () => void;
  skipScenes: () => void;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

let toastSeq = 0;

function settingsToPrefs(s: Settings) {
  return { sound: s.sound, music: s.music, animation: s.animation, reducedMotion: s.reducedMotion, theme: s.theme };
}

export const useGame = create<GameStore>((set, get) => {
  const apply = (game: GameState) => {
    set({ game, user: { username: game.user.username, email: game.user.email }, skew: game.serverTime - Date.now() });
  };

  /** Runs a mutation, surfaces errors as toasts, and guards against double-submits. */
  async function guarded<T>(key: string, fn: () => Promise<T>, opts: { quiet?: boolean } = {}): Promise<T | undefined> {
    if (get().busy[key]) return undefined;
    set((s) => ({ busy: { ...s.busy, [key]: true } }));
    try {
      return await fn();
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(0, 'ERROR', 'Something went wrong. Please try again.');
      if (!opts.quiet) {
        sfx.play('error');
        get().toast({ kind: 'error', title: 'Action failed', body: err.message });
      }
      throw err;
    } finally {
      set((s) => ({ busy: { ...s.busy, [key]: false } }));
    }
  }

  return {
    boot: 'loading',
    user: null,
    game: null,
    scenes: [],
    toasts: [],
    busy: {},
    skew: 0,

    init: async () => {
      setUnauthorizedHandler(() => set({ user: null, game: null, scenes: [] }));
      try {
        const me = await api<{ user: { username: string; email: string } | null }>('/auth/me');
        if (me.user) {
          const game = await api<GameState>('/state');
          usePrefs.getState().hydrate(settingsToPrefs(game.settings));
          apply(game);
        } else set({ user: null, game: null });
      } catch {
        set({ user: null, game: null });
      } finally {
        set({ boot: 'ready' });
      }
    },

    register: async (v) => {
      await api('/auth/register', { method: 'POST', body: { ...v, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone } });
      const game = await api<GameState>('/state');
      apply(game);
      // carry the local preferences (sound etc.) up to the new account
      const p = usePrefs.getState();
      void api('/settings', { method: 'PUT', body: { sound: p.sound, music: p.music, animation: p.animation, reducedMotion: p.reducedMotion, theme: p.theme } }).catch(() => undefined);
    },

    login: async (v) => {
      await api('/auth/login', { method: 'POST', body: v });
      const game = await api<GameState>('/state');
      usePrefs.getState().hydrate(settingsToPrefs(game.settings));
      apply(game);
    },

    logout: async () => {
      try {
        await api('/auth/logout', { method: 'POST' });
      } finally {
        set({ user: null, game: null, scenes: [], toasts: [] });
      }
    },

    refresh: async () => {
      const game = await api<GameState>('/state');
      apply(game);
    },

    createCharacter: async (v) => {
      await guarded('character', async () => {
        const game = await api<GameState>('/character', { method: 'POST', body: v });
        apply(game);
      });
    },

    startQuest: async (id) => {
      await guarded(`quest:${id}`, async () => {
        apply(await api<GameState>(`/quests/${encodeURIComponent(id)}/start`, { method: 'POST' }));
        sfx.play('click');
      });
    },

    abandonQuest: async (id) => {
      await guarded(`quest:${id}`, async () => {
        apply(await api<GameState>(`/quests/${encodeURIComponent(id)}/abandon`, { method: 'POST' }));
      });
    },

    completeQuest: async (id) => {
      await guarded(`quest:${id}`, async () => {
        const res = await api<CompleteQuestResponse>(`/quests/${encodeURIComponent(id)}/complete`, { method: 'POST' });
        apply(res.state);
        const { scenes, achievementIds } = buildScenes(res.events, res.state);
        set((s) => ({ scenes: [...s.scenes, ...scenes] }));
        for (const a of achievementIds) {
          const def = achievementById(a.id);
          if (def) get().toast({ kind: 'achievement', title: def.name, body: `${def.description}  +${a.rewardXp} XP`, icon: def.icon, tier: def.tier });
        }
      });
    },

    equipCard: async (id) => {
      await guarded(`card:${id}`, async () => {
        apply(await api<GameState>(`/cards/${id}/equip`, { method: 'POST' }));
        sfx.play('notify');
      });
    },
    unequipCard: async (id) => {
      await guarded(`card:${id}`, async () => {
        apply(await api<GameState>(`/cards/${id}/unequip`, { method: 'POST' }));
        sfx.play('click');
      });
    },
    selectWorld: async (id) => {
      await guarded(`world:${id}`, async () => {
        apply(await api<GameState>(`/worlds/${id}/select`, { method: 'POST' }));
        sfx.play('notify');
      });
    },
    renameCompanion: async (name) => {
      await guarded('companion', async () => {
        apply(await api<GameState>('/companion', { method: 'PUT', body: { name } }));
      });
    },

    saveSettings: async (patch) => {
      const prefsPatch: Partial<ReturnType<typeof settingsToPrefs>> = {};
      for (const k of ['sound', 'music', 'animation', 'reducedMotion', 'theme'] as const) {
        if (patch[k] !== undefined) (prefsPatch as Record<string, unknown>)[k] = patch[k];
      }
      usePrefs.getState().set(prefsPatch);
      if (!get().user) return;
      try {
        apply(await api<GameState>('/settings', { method: 'PUT', body: patch }));
      } catch (e) {
        get().toast({ kind: 'error', title: 'Could not save settings', body: e instanceof ApiError ? e.message : undefined });
      }
    },

    nextScene: () => set((s) => ({ scenes: s.scenes.slice(1) })),
    skipScenes: () => set({ scenes: [] }),
    toast: (t) => {
      const id = `t${++toastSeq}`;
      set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  };
});
