import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, GRID_SIZE, GRID_COLS, GRID_ROWS } from '../config/constants';
import { PATH, SPAWN, BASE } from '../config/level';
import { cellToWorld, cellKey, worldToCell } from '../systems/Grid';
import { Enemy } from '../entities/Enemy';
import { ENEMY_TYPES } from '../config/enemies';
import { Tower } from '../entities/Tower';
import { TOWER_TYPES } from '../config/towers';

const GRASS_COLOR = 0x3b6d11;
const PATH_COLOR = 0xba7517;
const GRID_LINE_COLOR = 0x000000;
const SPAWN_INTERVAL_MS = 2000;

export class Game extends Phaser.Scene {
  private waypoints: { x: number; y: number }[] = [];
  private enemies: Enemy[] = [];
  private pathCells = new Set<string>();
  private occupiedCells = new Set<string>();

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

    this.waypoints = PATH.map(cellToWorld);

    this.time.addEvent({
      delay: SPAWN_INTERVAL_MS,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.tryPlaceTower(pointer.x, pointer.y);
    });
  }

  update(_time: number, deltaMs: number) {
    const deltaSeconds = deltaMs / 1000;

    for (const enemy of this.enemies) {
      enemy.update(deltaSeconds);
    }

    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.reachedBase) {
        enemy.destroy();
        return false;
      }
      return true;
    });
  }

  private tryPlaceTower(x: number, y: number) {
    if (x < 0 || y < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return;

    const cell = worldToCell(x, y);
    const key = cellKey(cell);

    if (this.pathCells.has(key) || this.occupiedCells.has(key)) return;

    this.occupiedCells.add(key);
    new Tower(this, cell, cellToWorld(cell), TOWER_TYPES.arrow);
  }

  private spawnEnemy() {
    const enemy = new Enemy(this, this.waypoints, ENEMY_TYPES.grunt);
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
