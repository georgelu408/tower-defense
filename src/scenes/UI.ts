import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_WIDTH, UI_BAR_HEIGHT } from '../config/constants';

export class UI extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    this.add
      .rectangle(0, BOARD_HEIGHT, BOARD_WIDTH, UI_BAR_HEIGHT, 0x2c2c2a)
      .setOrigin(0, 0);

    this.add
      .text(BOARD_WIDTH / 2, BOARD_HEIGHT + UI_BAR_HEIGHT / 2, 'UI bar placeholder', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }
}
