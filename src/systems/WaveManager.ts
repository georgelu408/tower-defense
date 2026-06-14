import Phaser from 'phaser';
import { getEarlyWaveBonus, getWaveConfig, WAVE_BREAK_MS, WAVE_COUNT } from '../config/waves';
import type { EnemyType } from '../config/enemies';

export class WaveManager {
  private scene: Phaser.Scene;
  private onSpawn: (type: EnemyType, baseHP: number, goldReward: number) => void;
  private onWaveStart: (wave: number) => void;
  private onAllWavesSpawned: () => void;
  private onBreakUpdate: (remainingMs: number, bonus: number) => void;
  private onBreakEnd: () => void;

  private inBreak = false;
  private breakRemainingMs = 0;
  private nextWave = 1;

  constructor(
    scene: Phaser.Scene,
    onSpawn: (type: EnemyType, baseHP: number, goldReward: number) => void,
    onWaveStart: (wave: number) => void,
    onAllWavesSpawned: () => void,
    onBreakUpdate: (remainingMs: number, bonus: number) => void,
    onBreakEnd: () => void,
  ) {
    this.scene = scene;
    this.onSpawn = onSpawn;
    this.onWaveStart = onWaveStart;
    this.onAllWavesSpawned = onAllWavesSpawned;
    this.onBreakUpdate = onBreakUpdate;
    this.onBreakEnd = onBreakEnd;
  }

  start() {
    this.scheduleWave(1);
  }

  update(deltaMs: number) {
    if (!this.inBreak) return;

    this.breakRemainingMs -= deltaMs;
    if (this.breakRemainingMs <= 0) {
      this.endBreak();
    } else {
      this.onBreakUpdate(this.breakRemainingMs, getEarlyWaveBonus(this.nextWave, this.breakRemainingMs));
    }
  }

  /** Ends the current break early, if one is active, and returns the gold bonus earned. */
  skipBreak(): number {
    if (!this.inBreak) return 0;
    const bonus = getEarlyWaveBonus(this.nextWave, this.breakRemainingMs);
    this.endBreak();
    return bonus;
  }

  private endBreak() {
    this.inBreak = false;
    this.onBreakEnd();
    this.scheduleWave(this.nextWave);
  }

  private scheduleWave(wave: number) {
    if (wave > WAVE_COUNT) {
      this.onAllWavesSpawned();
      return;
    }

    this.onWaveStart(wave);
    const config = getWaveConfig(wave);

    config.composition.forEach((type, i) => {
      this.scene.time.delayedCall(i * config.spawnIntervalMs, () => {
        this.onSpawn(type, config.baseHP, config.goldReward);
      });
    });

    const waveDuration = config.composition.length * config.spawnIntervalMs;
    this.nextWave = wave + 1;
    this.scene.time.delayedCall(waveDuration, () => this.startBreak());
  }

  private startBreak() {
    if (this.nextWave > WAVE_COUNT) {
      this.onAllWavesSpawned();
      return;
    }

    this.inBreak = true;
    this.breakRemainingMs = WAVE_BREAK_MS;
    this.onBreakUpdate(this.breakRemainingMs, getEarlyWaveBonus(this.nextWave, this.breakRemainingMs));
  }
}
