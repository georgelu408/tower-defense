import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../config/constants';

export class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.add.rectangle(0, 0, BOARD_WIDTH, BOARD_HEIGHT, 0x3b6d11).setOrigin(0, 0);

    this.add
      .text(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, 'Tower Defense\n(board placeholder)', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);
  }
}
