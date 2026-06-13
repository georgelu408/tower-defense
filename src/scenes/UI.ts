import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_WIDTH, UI_BAR_HEIGHT } from '../config/constants';
import { TOWER_TYPES } from '../config/towers';
import type { TowerType } from '../config/towers';

const BUTTON_WIDTH = 150;
const BUTTON_HEIGHT = 96;
const BUTTON_COLOR = 0x3f3f3a;
const BUTTON_SELECTED_COLOR = 0x5d7a3a;

export class UI extends Phaser.Scene {
  private buttons = new Map<TowerType, Phaser.GameObjects.Rectangle>();

  constructor() {
    super('UI');
  }

  create() {
    this.add
      .rectangle(0, BOARD_HEIGHT, BOARD_WIDTH, UI_BAR_HEIGHT, 0x2c2c2a)
      .setOrigin(0, 0);

    const towerTypes = Object.keys(TOWER_TYPES) as TowerType[];
    const startX = 20;
    const y = BOARD_HEIGHT + UI_BAR_HEIGHT / 2;

    towerTypes.forEach((type, index) => {
      const def = TOWER_TYPES[type];
      const x = startX + index * (BUTTON_WIDTH + 16) + BUTTON_WIDTH / 2;

      const button = this.add
        .rectangle(x, y, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_COLOR)
        .setStrokeStyle(2, 0xffffff, 0.3)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(x, y - 32, `${def.label}`, {
          fontFamily: 'sans-serif',
          fontSize: '16px',
          color: '#ffffff',
        })
        .setOrigin(0.5);

      this.add
        .text(x, y - 10, `${def.cost} gold`, {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#d8d8d0',
        })
        .setOrigin(0.5);

      this.add
        .text(x, y + 16, def.description, {
          fontFamily: 'sans-serif',
          fontSize: '12px',
          color: '#aaaaaa',
          align: 'center',
          wordWrap: { width: BUTTON_WIDTH - 12 },
        })
        .setOrigin(0.5);

      button.on('pointerdown', () => {
        this.registry.set('selectedTowerType', type);
      });

      this.buttons.set(type, button);
    });

    if (!this.registry.get('selectedTowerType')) {
      this.registry.set('selectedTowerType', 'arrow' satisfies TowerType);
    }

    this.refreshSelection();
    this.registry.events.on('changedata-selectedTowerType', () => this.refreshSelection());
  }

  private refreshSelection() {
    const selected = this.registry.get('selectedTowerType') as TowerType | undefined;
    for (const [type, button] of this.buttons) {
      button.setFillStyle(type === selected ? BUTTON_SELECTED_COLOR : BUTTON_COLOR);
    }
  }
}
