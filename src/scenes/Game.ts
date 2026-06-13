import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, GRID_SIZE, GRID_COLS, GRID_ROWS } from '../config/constants';
import { PATH, SPAWN, BASE } from '../config/level';
import { cellToWorld } from '../systems/Grid';

const GRASS_COLOR = 0x3b6d11;
const PATH_COLOR = 0xba7517;
const GRID_LINE_COLOR = 0x000000;

export class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.add.rectangle(0, 0, BOARD_WIDTH, BOARD_HEIGHT, GRASS_COLOR).setOrigin(0, 0);

    for (const cell of PATH) {
      this.add
        .rectangle(cell.col * GRID_SIZE, cell.row * GRID_SIZE, GRID_SIZE, GRID_SIZE, PATH_COLOR)
        .setOrigin(0, 0);
    }

    this.drawGridLines();
    this.drawMarker(SPAWN, 0x378add, 'Spawn');
    this.drawMarker(BASE, 0xe24b4a, 'Base');
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
