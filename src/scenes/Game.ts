import Phaser from 'phaser';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  GRID_SIZE,
  GRID_COLS,
  GRID_ROWS,
  STARTING_GOLD,
  STARTING_LIVES,
} from '../config/constants';
import { PATH, SPAWN, BASE } from '../config/level';
import { cellToWorld, cellKey, worldToCell } from '../systems/Grid';
import { Enemy } from '../entities/Enemy';
import { resolveEnemySpec } from '../config/enemies';
import type { EnemyType } from '../config/enemies';
import { Tower } from '../entities/Tower';
import { TOWER_TYPES } from '../config/towers';
import type { TowerType } from '../config/towers';
import type { Projectile } from '../entities/Projectile';
import { WaveManager } from '../systems/WaveManager';
import { WAVE_COUNT } from '../config/waves';
import { BUILD_SLOTS } from '../config/slots';

const GRASS_COLOR = 0x3b6d11;
const PATH_COLOR = 0xba7517;
const GRID_LINE_COLOR = 0x000000;
const SLOT_COLOR = 0xf2d680;

export class Game extends Phaser.Scene {
  private waypoints: { x: number; y: number }[] = [];
  private enemies: Enemy[] = [];
  private towers: Tower[] = [];
  private projectiles: Projectile[] = [];
  private pathCells = new Set<string>();
  private occupiedCells = new Set<string>();
  private slotCells = new Set<string>();
  private slotMarkers = new Map<string, Phaser.GameObjects.Arc>();
  private gold = STARTING_GOLD;
  private lives = STARTING_LIVES;
  private wave = 0;
  private allWavesSpawned = false;
  private gameOver = false;
  private goldText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super('Game');
  }

  create() {
    this.add.rectangle(0, 0, BOARD_WIDTH, BOARD_HEIGHT, GRASS_COLOR).setOrigin(0, 0);

    for (const cell of PATH) {
      this.pathCells.add(cellKey(cell));
      this.add
        .rectangle(cell.col * GRID_SIZE, cell.row * GRID_SIZE, GRID_SIZE, GRID_SIZE, PATH_COLOR)
        .setOrigin(0, 0);
    }

    this.drawGridLines();
    this.drawMarker(SPAWN, 0x378add, 'Spawn');
    this.drawMarker(BASE, 0xe24b4a, 'Base');

    for (const cell of BUILD_SLOTS) {
      const key = cellKey(cell);
      this.slotCells.add(key);
      const { x, y } = cellToWorld(cell);
      const marker = this.add.circle(x, y, GRID_SIZE * 0.35, SLOT_COLOR, 0.25);
      marker.setStrokeStyle(2, SLOT_COLOR, 0.6);
      this.slotMarkers.set(key, marker);
    }

    this.registry.set('selectedTowerType', 'arrow' satisfies TowerType);

    this.goldText = this.add.text(8, 8, '', {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    this.livesText = this.add.text(8, 28, '', {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    this.waveText = this.add.text(8, 48, '', {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    this.statusText = this.add
      .text(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, '', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);

    this.refreshHud();

    this.waypoints = PATH.map(cellToWorld);

    new WaveManager(
      this,
      (type, baseHP, goldReward) => this.spawnEnemy(type, baseHP, goldReward),
      (wave) => {
        this.wave = wave;
        this.refreshHud();
      },
      () => {
        this.allWavesSpawned = true;
      },
    ).start();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.tryPlaceTower(pointer.x, pointer.y);
    });
  }

  update(_time: number, deltaMs: number) {
    if (this.gameOver) return;

    const deltaSeconds = deltaMs / 1000;

    for (const enemy of this.enemies) {
      enemy.update(deltaSeconds);
    }

    for (const tower of this.towers) {
      const projectile = tower.update(deltaSeconds, this.enemies);
      if (projectile) {
        this.projectiles.push(projectile);
      }
    }

    for (const projectile of this.projectiles) {
      projectile.update(deltaSeconds, this.enemies);
    }
    this.projectiles = this.projectiles.filter((projectile) => {
      if (projectile.spent) {
        projectile.destroy();
        return false;
      }
      return true;
    });

    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.isDead) {
        this.addGold(enemy.goldReward);
        enemy.destroy();
        return false;
      }
      if (enemy.reachedBase) {
        enemy.destroy();
        this.loseLife();
        return false;
      }
      return true;
    });

    if (!this.gameOver && this.allWavesSpawned && this.enemies.length === 0) {
      this.win();
    }
  }

  private addGold(amount: number) {
    this.gold += amount;
    this.refreshHud();
  }

  private loseLife() {
    this.lives -= 1;
    this.refreshHud();
    if (this.lives <= 0) {
      this.lose();
    }
  }

  private win() {
    this.gameOver = true;
    this.statusText.setText('You win!');
  }

  private lose() {
    this.gameOver = true;
    this.statusText.setText('Game over');
  }

  private refreshHud() {
    this.goldText.setText(`Gold: ${this.gold}`);
    this.livesText.setText(`Lives: ${this.lives}`);
    this.waveText.setText(`Wave: ${this.wave} / ${WAVE_COUNT}`);
  }

  private tryPlaceTower(x: number, y: number) {
    if (this.gameOver) return;
    if (x < 0 || y < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return;

    const cell = worldToCell(x, y);
    const key = cellKey(cell);

    if (!this.slotCells.has(key) || this.occupiedCells.has(key)) return;

    const towerType = this.registry.get('selectedTowerType') as TowerType;
    const def = TOWER_TYPES[towerType];
    if (this.gold < def.cost) return;

    this.gold -= def.cost;
    this.refreshHud();

    this.occupiedCells.add(key);
    this.slotMarkers.get(key)?.setVisible(false);
    this.towers.push(new Tower(this, cell, cellToWorld(cell), def));
  }

  private spawnEnemy(type: EnemyType, baseHP: number, goldReward: number) {
    const spec = resolveEnemySpec(type, baseHP, goldReward);
    const enemy = new Enemy(this, this.waypoints, spec);
    this.enemies.push(enemy);
  }

  private drawGridLines() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, GRID_LINE_COLOR, 0.15);

    for (let col = 0; col <= GRID_COLS; col++) {
      graphics.moveTo(col * GRID_SIZE, 0);
      graphics.lineTo(col * GRID_SIZE, BOARD_HEIGHT);
    }
    for (let row = 0; row <= GRID_ROWS; row++) {
      graphics.moveTo(0, row * GRID_SIZE);
      graphics.lineTo(BOARD_WIDTH, row * GRID_SIZE);
    }
    graphics.strokePath();
  }

  private drawMarker(cell: { col: number; row: number }, color: number, label: string) {
    const { x, y } = cellToWorld(cell);
    this.add.circle(x, y, GRID_SIZE * 0.3, color);
    this.add
      .text(x, y - GRID_SIZE * 0.6, label, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }
}
