import type { EnemyType } from './enemies';

export const WAVE_COUNT = 10;
export const SPAWN_INTERVAL_MS = 1000;
export const WAVE_BREAK_MS = 3000;

export interface WaveConfig {
  baseHP: number;
  goldReward: number;
  composition: EnemyType[];
}

export function getWaveConfig(wave: number): WaveConfig {
  const enemyCount = 4 + wave;
  const baseHP = Math.round(10 * Math.pow(1.13, wave - 1));
  const goldReward = 5 + Math.floor(wave / 2.5);

  const composition: EnemyType[] = [];
  for (let i = 0; i < enemyCount; i++) {
    const isTank = wave >= 4 && i % 3 === 2;
    const isFast = wave >= 3 && i % 4 === 1;
    composition.push(isTank ? 'tank' : isFast ? 'fast' : 'grunt');
  }

  return { baseHP, goldReward, composition };
}
