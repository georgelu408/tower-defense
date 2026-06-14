import type { EnemyType } from './enemies';

export const WAVE_COUNT = 10;
export const WAVE_BREAK_MS = 6000;
const MIN_SPAWN_INTERVAL_MS = 350;
const MAX_SPAWN_INTERVAL_MS = 1000;
const SPAWN_INTERVAL_STEP_MS = 70;

export interface WaveConfig {
  baseHP: number;
  goldReward: number;
  spawnIntervalMs: number;
  composition: EnemyType[];
}

/** Max gold bonus for calling a wave the instant the break starts. Decays to 0 as the break runs out. */
export function getMaxEarlyWaveBonus(wave: number): number {
  return 10 + wave * 2;
}

export function getEarlyWaveBonus(wave: number, remainingMs: number): number {
  const fraction = Math.min(1, Math.max(0, remainingMs / WAVE_BREAK_MS));
  return Math.round(getMaxEarlyWaveBonus(wave) * fraction);
}

export function getWaveConfig(wave: number): WaveConfig {
  const enemyCount = 4 + wave * 2;
  const baseHP = Math.round(20 * Math.pow(1.2, wave - 1));
  const goldReward = 5 + Math.floor(wave / 2.5);
  const spawnIntervalMs = Math.max(
    MIN_SPAWN_INTERVAL_MS,
    MAX_SPAWN_INTERVAL_MS - (wave - 1) * SPAWN_INTERVAL_STEP_MS,
  );

  const composition: EnemyType[] = [];
  for (let i = 0; i < enemyCount; i++) {
    const isTank = wave >= 4 && i % 3 === 2;
    const isFast = wave >= 3 && i % 4 === 1;
    composition.push(isTank ? 'tank' : isFast ? 'fast' : 'grunt');
  }

  return { baseHP, goldReward, spawnIntervalMs, composition };
}
