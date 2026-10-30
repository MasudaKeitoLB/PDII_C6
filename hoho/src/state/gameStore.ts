import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyExp } from '../game/levelTable';

export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const todayKey = () => dateKey(new Date());

type Settings = {
  nickname: string;
  goal: number; // 1日の目標歩数
  heightCm: number;
  weightKg: number;
  bigText: boolean; // 文字を大きくする
};

type GameState = Settings & {
  level: number;
  expInLevel: number;
  prevLevel: number;
  points: number;
  history: Record<string, number>; // { '2026-10-30': 4210, ... }
  gain: (steps: number, points: number) => void;
  update: (patch: Partial<Settings>) => void;
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      nickname: 'はなこ',
      goal: 5000,
      heightCm: 160,
      weightKg: 55,
      bigText: false,
      level: 1,
      expInLevel: 0,
      prevLevel: 1,
      points: 0,
      history: {},
      gain: (steps, points) => {
        const s = get();
        const next = applyExp(s.level, s.expInLevel, steps);
        const key = todayKey();
        set({
          prevLevel: s.level,
          level: next.level,
          expInLevel: next.expInLevel,
          points: s.points + points,
          history: { ...s.history, [key]: (s.history[key] ?? 0) + steps },
        });
      },
      update: (patch) => set(patch),
    }),
    { name: 'hoho-game', storage: createJSONStorage(() => AsyncStorage) },
  ),
);