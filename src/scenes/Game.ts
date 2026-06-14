import Phaser from 'phaser';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  GRID_SIZE,
  GRID_COLS,
  GRID_ROWS,
  STARTING_GOLD,
  STARTING_LIVES,
  HUD_BAR_HEIGHT,
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
import { FIREBALL } from '../config/abilities';

const GRASS_COLOR = 0x3b6d11;
const PATH_COLOR = 0xba7517;
const GRID_LINE_COLOR = 0x000000;
const PLACEMENT_VALID_COLOR = 0x4fd1ff;
const PLACEMENT_INVALID_COLOR = 0xe24b4a;
const SELL_HIGHLIGHT_COLOR = 0xe24b4a;

/** Minimum cell distance (Chebyshev) between two towers - requires at least one empty cell of gap. */
const MIN_TOWER_GAP_CELLS = 2;

export class Game extends Phaser.Scene {
  private waypoints: { x: number; y: number }[] = [];
  private enemies: Enemy[] = [];
  private towers: Tower[] = [];
  private projectiles: Projectile[] = [];
  private pathCells = new Set<string>();
  private placementIndicator!: Phaser.GameObjects.Rectangle;
  private placementRangeIndicator!: Phaser.GameObjects.Arc;
  private sellIndicator!: Phaser.GameObjects.Arc;
  private gold = STARTING_GOLD;
  private lives = STARTING_LIVES;
  private wave = 0;
  private allWavesSpawned = false;
  private gameOver = false;
  private fireballCooldownMs = 0;
  private fireballRangeIndicator!: Phaser.GameObjects.Arc;
  private waveManager!: WaveManager;
  private waveStarted = false;
  private baseGlow!: Phaser.GameObjects.Arc;
  private goldText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private gameOverOverlay!: Phaser.GameObjects.Rectangle;
  private restartButtonBg!: Phaser.GameObjects.Graphics;
  private restartButtonText!: Phaser.GameObjects.Text;

  constructor() {
    super('Game');
  }

  init() {
    this.waypoints = [];
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.pathCells = new Set<string>();
    this.gold = STARTING_GOLD;
    this.lives = STARTING_LIVES;
    this.wave = 0;
    this.allWavesSpawned = false;
    this.gameOver = false;
    this.fireballCooldownMs = 0;
    this.waveStarted = false;
  }

  create() {
    this.add.rectangle(0, HUD_BAR_HEIGHT, BOARD_WIDTH, BOARD_HEIGHT, GRASS_COLOR).setOrigin(0, 0);

    for (const cell of PATH) {
      this.pathCells.add(cellKey(cell));
      this.add
        .rectangle(cell.col * GRID_SIZE, cell.row * GRID_SIZE + HUD_BAR_HEIGHT, GRID_SIZE, GRID_SIZE, PATH_COLOR)
        .setOrigin(0, 0);
    }

    this.drawGridLines();
    this.drawSpawnMarker(SPAWN);
    this.drawBaseMarker(BASE);

    this.registry.set('selectedTowerType', 'arrow' satisfies TowerType);
    this.registry.set('fireballArmed', false);
    this.registry.set('fireballCooldownMs', 0);
    this.registry.set('fireballCooldownTotalMs', FIREBALL.cooldownMs);
    this.registry.set('sellArmed', false);
    this.registry.set('waveStarted', false);
    this.registry.set('waveBreakActive', false);
    this.registry.set('waveBreakRemainingMs', 0);
    this.registry.set('waveBreakBonus', 0);

    this.add.rectangle(0, 0, BOARD_WIDTH, HUD_BAR_HEIGHT, 0x232320).setOrigin(0, 0);

    const hudY = (HUD_BAR_HEIGHT - 36) / 2;
    this.goldText = this.createHudPill(8, hudY, 100, (g, x, y) => {
      g.fillStyle(0xf4c542, 1);
      g.fillCircle(x, y, 9);
      g.lineStyle(1.5, 0xc9941f, 1);
      g.strokeCircle(x, y, 9);
    });
    this.livesText = this.createHudPill(116, hudY, 90, (g, x, y) => {
      g.fillStyle(0xe24b4a, 1);
      g.fillCircle(x - 4, y - 2, 5);
      g.fillCircle(x + 4, y - 2, 5);
      g.fillTriangle(x - 8.5, y, x + 8.5, y, x, y + 9);
    });
    this.waveText = this.createHudPill(214, hudY, 110, (g, x, y) => {
      g.lineStyle(2, 0xffffff, 0.9);
      g.lineBetween(x - 6, y - 9, x - 6, y + 9);
      g.fillStyle(0x6fae3f, 1);
      g.fillTriangle(x - 6, y - 9, x + 7, y - 5, x - 6, y - 1);
    });
    this.gameOverOverlay = this.add
      .rectangle(0, HUD_BAR_HEIGHT, BOARD_WIDTH, BOARD_HEIGHT, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setDepth(50)
      .setVisible(false);

    this.statusText = this.add
      .text(BOARD_WIDTH / 2, HUD_BAR_HEIGHT + BOARD_HEIGHT / 2 - 20, '', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(51);

    const restartY = HUD_BAR_HEIGHT + BOARD_HEIGHT / 2 + 40;
    this.restartButtonBg = this.add.graphics().setPosition(BOARD_WIDTH / 2, restartY).setDepth(51).setVisible(false);
    this.restartButtonBg.fillStyle(0x5d7a3a, 1);
    this.restartButtonBg.fillRoundedRect(-70, -22, 140, 44, 12);
    this.restartButtonBg.lineStyle(2, 0xffffff, 0.25);
    this.restartButtonBg.strokeRoundedRect(-70, -22, 140, 44, 12);
    this.restartButtonBg.setInteractive(new Phaser.Geom.Rectangle(-70, -22, 140, 44), Phaser.Geom.Rectangle.Contains);
    this.restartButtonBg.on('pointerover', () => this.restartButtonBg.setAlpha(0.85));
    this.restartButtonBg.on('pointerout', () => this.restartButtonBg.setAlpha(1));
    this.restartButtonBg.on('pointerdown', () => this.restartGame());

    this.restartButtonText = this.add
      .text(BOARD_WIDTH / 2, restartY, 'Play Again', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(52)
      .setVisible(false);

    this.refreshHud();

    this.waypoints = PATH.map(cellToWorld);

    this.waveManager = new WaveManager(
      this,
      (type, baseHP, goldReward) => this.spawnEnemy(type, baseHP, goldReward),
      (wave) => {
        this.wave = wave;
        this.refreshHud();
      },
      () => {
        this.allWavesSpawned = true;
      },
      (remainingMs, bonus) => this.updateWaveBreak(remainingMs, bonus),
      () => this.hideWaveBreak(),
    );

    this.fireballRangeIndicator = this.add.circle(0, 0, FIREBALL.radius, 0xff6a00, 0.15);
    this.fireballRangeIndicator.setStrokeStyle(2, 0xffae00, 0.8);
    this.fireballRangeIndicator.setVisible(false);

    this.placementIndicator = this.add.rectangle(0, 0, GRID_SIZE, GRID_SIZE, PLACEMENT_VALID_COLOR, 0.25);
    this.placementIndicator.setStrokeStyle(2, PLACEMENT_VALID_COLOR, 0.9);
    this.placementIndicator.setVisible(false);

    this.placementRangeIndicator = this.add.circle(0, 0, GRID_SIZE, 0xffffff, 0.06);
    this.placementRangeIndicator.setStrokeStyle(1, 0xffffff, 0.2);
    this.placementRangeIndicator.setVisible(false);

    this.sellIndicator = this.add.circle(0, 0, GRID_SIZE * 0.4, SELL_HIGHLIGHT_COLOR, 0.25);
    this.sellIndicator.setStrokeStyle(2, SELL_HIGHLIGHT_COLOR, 0.9);
    this.sellIndicator.setVisible(false);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.registry.get('fireballArmed')) {
        this.castFireball(pointer.x, pointer.y);
        return;
      }
      if (this.registry.get('sellArmed')) {
        this.sellTowerAt(pointer.x, pointer.y);
        return;
      }
      this.tryPlaceTower(pointer.x, pointer.y);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const inBounds =
        pointer.x >= 0 &&
        pointer.y >= HUD_BAR_HEIGHT &&
        pointer.x < BOARD_WIDTH &&
        pointer.y < HUD_BAR_HEIGHT + BOARD_HEIGHT;
      const fireballArmed = !!this.registry.get('fireballArmed');
      const sellArmed = !!this.registry.get('sellArmed');

      this.fireballRangeIndicator.setVisible(fireballArmed && inBounds);
      if (fireballArmed && inBounds) {
        this.fireballRangeIndicator.setPosition(pointer.x, pointer.y);
      }

      this.sellIndicator.setVisible(false);
      this.placementIndicator.setVisible(false);
      this.placementRangeIndicator.setVisible(false);

      if (sellArmed && inBounds) {
        const tower = this.findTowerAt(pointer.x, pointer.y);
        if (tower) {
          this.sellIndicator.setPosition(tower.x, tower.y);
          this.sellIndicator.setVisible(true);
        }
      } else if (!fireballArmed && !sellArmed && inBounds) {
        const cell = worldToCell(pointer.x, pointer.y);
        const { x, y } = cellToWorld(cell);
        const valid = this.isPlacementValid(cell);
        this.placementIndicator.setPosition(x, y);
        this.placementIndicator.setFillStyle(
          valid ? PLACEMENT_VALID_COLOR : PLACEMENT_INVALID_COLOR,
          0.25,
        );
        this.placementIndicator.setStrokeStyle(
          2,
          valid ? PLACEMENT_VALID_COLOR : PLACEMENT_INVALID_COLOR,
          0.9,
        );
        this.placementIndicator.setVisible(true);

        const towerType = this.registry.get('selectedTowerType') as TowerType;
        const range = TOWER_TYPES[towerType].range;
        this.placementRangeIndicator.setRadius(range);
        this.placementRangeIndicator.setPosition(x, y);
        this.placementRangeIndicator.setVisible(true);
      }
    });
  }

  update(_time: number, deltaMs: number) {
    if (this.gameOver) return;

    const deltaSeconds = deltaMs / 1000;

    if (this.fireballCooldownMs > 0) {
      this.fireballCooldownMs = Math.max(0, this.fireballCooldownMs - deltaMs);
      this.registry.set('fireballCooldownMs', this.fireballCooldownMs);
    }

    if (!this.registry.get('fireballArmed')) {
      this.fireballRangeIndicator.setVisible(false);
    }

    this.waveManager.update(deltaMs);

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
        this.spawnDeathParticles(enemy.x, enemy.y, enemy.color);
        this.addGold(enemy.goldReward);
        enemy.destroy();
        return false;
      }
      if (enemy.reachedBase) {
        enemy.destroy();
        this.loseLife();
        this.pulseBase();
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
    this.showGameOverOverlay();
  }

  private lose() {
    this.gameOver = true;
    this.statusText.setText('Game over');
    this.showGameOverOverlay();
  }

  private showGameOverOverlay() {
    this.gameOverOverlay.setVisible(true);
    this.restartButtonBg.setVisible(true);
    this.restartButtonText.setVisible(true);
  }

  private restartGame() {
    this.scene.get('UI').scene.restart();
    this.scene.restart();
  }

  private refreshHud() {
    this.goldText.setText(`${this.gold}`);
    this.livesText.setText(`${this.lives}`);
    this.waveText.setText(`${this.wave} / ${WAVE_COUNT}`);
  }

  /** Creates a rounded pill badge with a custom icon on the left and a text value on the right. */
  private createHudPill(
    x: number,
    y: number,
    width: number,
    drawIcon: (g: Phaser.GameObjects.Graphics, iconX: number, iconY: number) => void,
  ): Phaser.GameObjects.Text {
    const height = 36;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.55);
    bg.fillRoundedRect(x, y, width, height, height / 2);
    bg.lineStyle(1.5, 0xffffff, 0.15);
    bg.strokeRoundedRect(x, y, width, height, height / 2);

    const icon = this.add.graphics();
    drawIcon(icon, x + height / 2, y + height / 2);

    return this.add
      .text(x + height + 4, y + height / 2, '', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0, 0.5);
  }

  private tryPlaceTower(x: number, y: number) {
    if (this.gameOver) return;
    if (x < 0 || y < HUD_BAR_HEIGHT || x >= BOARD_WIDTH || y >= HUD_BAR_HEIGHT + BOARD_HEIGHT) return;

    const cell = worldToCell(x, y);
    if (!this.isPlacementValid(cell)) return;

    const towerType = this.registry.get('selectedTowerType') as TowerType;
    const def = TOWER_TYPES[towerType];
    if (this.gold < def.cost) return;

    this.gold -= def.cost;
    this.refreshHud();

    this.towers.push(new Tower(this, cell, cellToWorld(cell), def));
    this.placementIndicator.setVisible(false);
  }

  /** A cell is a valid tower placement if it's grass (not path) and far enough from other towers. */
  private isPlacementValid(cell: { col: number; row: number }): boolean {
    if (this.pathCells.has(cellKey(cell))) return false;

    for (const tower of this.towers) {
      const dCol = Math.abs(tower.cell.col - cell.col);
      const dRow = Math.abs(tower.cell.row - cell.row);
      if (Math.max(dCol, dRow) < MIN_TOWER_GAP_CELLS) return false;
    }

    return true;
  }

  private findTowerAt(x: number, y: number): Tower | null {
    const cell = worldToCell(x, y);
    return this.towers.find((tower) => tower.cell.col === cell.col && tower.cell.row === cell.row) ?? null;
  }

  private sellTowerAt(x: number, y: number) {
    if (this.gameOver) return;
    if (x < 0 || y < HUD_BAR_HEIGHT || x >= BOARD_WIDTH || y >= HUD_BAR_HEIGHT + BOARD_HEIGHT) return;

    const tower = this.findTowerAt(x, y);
    if (!tower) return;

    this.towers = this.towers.filter((t) => t !== tower);
    tower.destroy();
    this.addGold(Math.floor(tower.def.cost / 2));
    this.sellIndicator.setVisible(false);
  }

  private updateWaveBreak(remainingMs: number, bonus: number) {
    this.registry.set('waveBreakActive', true);
    this.registry.set('waveBreakRemainingMs', remainingMs);
    this.registry.set('waveBreakBonus', bonus);
  }

  private hideWaveBreak() {
    this.registry.set('waveBreakActive', false);
  }

  /** Starts wave 1. Called from the UI once the player is ready. */
  startGame() {
    if (this.waveStarted) return;
    this.waveStarted = true;
    this.registry.set('waveStarted', true);
    this.waveManager.start();
  }

  skipWaveBreak() {
    if (this.gameOver) return;
    const bonus = this.waveManager.skipBreak();
    if (bonus > 0) {
      this.addGold(bonus);
    }
  }

  private castFireball(x: number, y: number) {
    if (this.gameOver || this.fireballCooldownMs > 0) return;
    if (x < 0 || y < HUD_BAR_HEIGHT || x >= BOARD_WIDTH || y >= HUD_BAR_HEIGHT + BOARD_HEIGHT) return;

    for (const enemy of this.enemies) {
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (distance <= FIREBALL.radius) {
        enemy.takeDamage(FIREBALL.damage, 'splash');
      }
    }

    this.fireballCooldownMs = FIREBALL.cooldownMs;
    this.registry.set('fireballCooldownMs', this.fireballCooldownMs);
    this.registry.set('fireballArmed', false);
    this.showExplosion(x, y);
  }

  private showExplosion(x: number, y: number) {
    const circle = this.add.circle(x, y, FIREBALL.radius, 0xff6a00, 0.5);
    circle.setStrokeStyle(3, 0xffae00, 0.9);
    this.tweens.add({
      targets: circle,
      scale: 1.4,
      alpha: 0,
      duration: 400,
      onComplete: () => circle.destroy(),
    });
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
      graphics.moveTo(col * GRID_SIZE, HUD_BAR_HEIGHT);
      graphics.lineTo(col * GRID_SIZE, HUD_BAR_HEIGHT + BOARD_HEIGHT);
    }
    for (let row = 0; row <= GRID_ROWS; row++) {
      graphics.moveTo(0, row * GRID_SIZE + HUD_BAR_HEIGHT);
      graphics.lineTo(BOARD_WIDTH, row * GRID_SIZE + HUD_BAR_HEIGHT);
    }
    graphics.strokePath();
  }

  /** Draws a pulsing portal where enemies enter the board. */
  private drawSpawnMarker(cell: { col: number; row: number }) {
    const { x, y } = cellToWorld(cell);
    const color = 0x378add;

    const ring = this.add.circle(x, y, GRID_SIZE * 0.35, color, 0.15);
    ring.setStrokeStyle(2, color, 0.6);
    this.tweens.add({
      targets: ring,
      scale: 1.35,
      alpha: 0.05,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.circle(x, y, GRID_SIZE * 0.18, color, 0.9);
  }

  /** Draws a small fort representing the base, with a glow that pulses when it takes damage. */
  private drawBaseMarker(cell: { col: number; row: number }) {
    const { x, y } = cellToWorld(cell);

    this.baseGlow = this.add.circle(x, y, GRID_SIZE * 0.45, 0xe24b4a, 0.22);

    const graphics = this.add.graphics();
    graphics.fillStyle(0x9c8a6b, 1);
    graphics.fillRoundedRect(x - 16, y - 4, 32, 22, 3);
    graphics.fillStyle(0xb33b3b, 1);
    graphics.fillTriangle(x - 18, y - 4, x + 18, y - 4, x, y - 20);
    graphics.fillStyle(0xe8e0cf, 1);
    graphics.fillRect(x - 1, y - 30, 2, 14);
    graphics.fillStyle(0xe24b4a, 1);
    graphics.fillTriangle(x + 1, y - 30, x + 1, y - 22, x + 13, y - 26);
  }

  /** Flashes and briefly enlarges the base glow when the base takes damage. */
  private pulseBase() {
    this.baseGlow.setScale(1);
    this.baseGlow.setAlpha(0.6);
    this.tweens.add({
      targets: this.baseGlow,
      scale: 1.6,
      alpha: 0.22,
      duration: 250,
      ease: 'Sine.easeOut',
    });
  }

  /** Spawns a small burst of particles at the given position, matching the given color. */
  private spawnDeathParticles(x: number, y: number, color: number) {
    const PARTICLE_COUNT = 8;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const distance = 18 + Math.random() * 14;
      const particle = this.add.circle(x, y, 3, color, 0.9);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.3,
        duration: 350,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }
}
