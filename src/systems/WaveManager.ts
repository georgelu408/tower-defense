import Phaser from 'phaser';
import { getWaveConfig, SPAWN_INTERVAL_MS, WAVE_BREAK_MS, WAVE_COUNT } from '../config/waves';
import type { EnemyType } from '../config/enemies';

export class WaveManager {
  private scene: Phaser.Scene;
  private onSpawn: (type: EnemyType, baseHP: number, goldReward: number) => void;
  private onWaveStart: (wave: number) => void;
  private onAllWavesSpawned: () => void;

  constructor(
    scene: Phaser.Scene,
    onSpawn: (type: EnemyType, baseHP: number, goldReward: number) => void,
    onWaveStart: (wave: number) => void,
    onAllWavesSpawned: () => void,
  ) {
    this.scene = scene;
    this.onSpawn = onSpawn;
    this.onWaveStart = onWaveStart;
    this.onAllWavesSpawned = onAllWavesSpawned;
  }

  start() {
    this.scheduleWave(1);
  }

  private scheduleWave(wave: number) {
    if (wave > WAVE_COUNT) {
      this.onAllWavesSpawned();
      return;
    }

    this.onWaveStart(wave);
    const config = getWaveConfig(wave);

    config.composition.forEach((type, i) => {
      this.scene.time.delayedCall(i * SPAWN_INTERVAL_MS, () => {
        this.onSpawn(type, config.baseHP, config.goldReward);
      });
    });

    const waveDuration = config.composition.length * SPAWN_INTERVAL_MS;
    this.scene.time.delayedCall(waveDuration + WAVE_BREAK_MS, () => this.scheduleWave(wave + 1));
  }
}
