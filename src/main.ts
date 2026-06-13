import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { UI } from './scenes/UI';
import { GAME_WIDTH, GAME_HEIGHT } from './config/constants';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1d1d1d',
  scene: [Boot, Game, UI],
});
