import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_WIDTH, UI_BAR_HEIGHT, HUD_BAR_HEIGHT } from '../config/constants';
import { TOWER_TYPES } from '../config/towers';
import type { TowerDef, TowerType } from '../config/towers';
import { FIREBALL } from '../config/abilities';
import type { Game } from './Game';

const BUTTON_COUNT = 7;
const MARGIN = 16;
const GAP = 8;
const BUTTON_WIDTH = (BOARD_WIDTH - 2 * MARGIN - (BUTTON_COUNT - 1) * GAP) / BUTTON_COUNT;
const BUTTON_HEIGHT = 64;
const BUTTON_RADIUS = 14;
const ICON_RADIUS = 10;
const ICON_OFFSET_Y = -(BUTTON_HEIGHT / 2) + 22;
const LABEL_OFFSET_Y = BUTTON_HEIGHT / 2 - 14;

const BUTTON_COLOR = 0x3f3f3a;
const BUTTON_SELECTED_COLOR = 0x5d7a3a;
const BUTTON_ARMED_COLOR = 0xb35900;
const BUTTON_DISABLED_COLOR = 0x2a2a28;

const TOOLTIP_BG_COLOR = 0x111110;
const TOOLTIP_PADDING = 10;

/** Creates a rounded-rect graphics button centered at (x, y), with a matching rectangular hit area. */
function createButton(scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.setPosition(x, y);
  g.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  return g;
}

function setButtonFill(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number) {
  g.clear();
  g.fillStyle(color, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, BUTTON_RADIUS);
  g.lineStyle(2, 0xffffff, 0.18);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, BUTTON_RADIUS);
}

/** Adds a subtle press/hover scale animation to a button. */
function addPressAnimation(scene: Phaser.Scene, g: Phaser.GameObjects.Graphics) {
  g.on('pointerdown', () => scene.tweens.add({ targets: g, scale: 0.95, duration: 70 }));
  g.on('pointerup', () => scene.tweens.add({ targets: g, scale: 1, duration: 90 }));
  g.on('pointerout', () => scene.tweens.add({ targets: g, scale: 1, duration: 90 }));
}

function drawTowerIcon(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number) {
  g.fillStyle(color, 1);
  g.fillCircle(x, y, ICON_RADIUS);
  g.lineStyle(1.5, 0xffffff, 0.6);
  g.strokeCircle(x, y, ICON_RADIUS);
}

function drawFlagIcon(g: Phaser.GameObjects.Graphics, x: number, y: number) {
  g.lineStyle(2, 0xffffff, 0.9);
  g.lineBetween(x - 6, y - 9, x - 6, y + 9);
  g.fillStyle(0x6fae3f, 1);
  g.fillTriangle(x - 6, y - 9, x + 7, y - 5, x - 6, y - 1);
}

function drawCoinIcon(g: Phaser.GameObjects.Graphics, x: number, y: number) {
  g.fillStyle(0xf4c542, 1);
  g.fillCircle(x, y, ICON_RADIUS);
  g.lineStyle(1.5, 0xc9941f, 1);
  g.strokeCircle(x, y, ICON_RADIUS);
}

function drawFireballIcon(g: Phaser.GameObjects.Graphics, x: number, y: number) {
  g.fillStyle(0xd9491f, 1);
  g.fillCircle(x, y, ICON_RADIUS);
  g.fillStyle(0xffae00, 1);
  g.fillCircle(x - 2, y - 2, ICON_RADIUS * 0.45);
}

function drawPauseIcon(g: Phaser.GameObjects.Graphics, x: number, y: number) {
  g.fillStyle(0xffffff, 0.9);
  g.fillRoundedRect(x - 7, y - 8, 4, 16, 1);
  g.fillRoundedRect(x + 3, y - 8, 4, 16, 1);
}

function drawPlayIcon(g: Phaser.GameObjects.Graphics, x: number, y: number) {
  g.fillStyle(0xffffff, 0.9);
  g.fillTriangle(x - 6, y - 8, x - 6, y + 8, x + 8, y);
}

/** Builds the hover-tooltip lines describing a tower's cost, stats, and behavior. */
function towerTooltipLines(def: TowerDef): string[] {
  const lines = [
    `${def.label} - ${def.cost} gold`,
    def.description,
    `Damage ${def.damage}  |  Range ${def.range}  |  Fire rate ${def.fireRate}/s`,
  ];
  if (def.splashRadius) {
    lines.push(`Splash radius ${def.splashRadius}`);
  }
  if (def.slow) {
    lines.push(`Slows to ${Math.round(def.slow.multiplier * 100)}% for ${def.slow.durationMs / 1000}s`);
  }
  return lines;
}

export class UI extends Phaser.Scene {
  private buttons = new Map<TowerType, Phaser.GameObjects.Graphics>();
  private pauseButton!: Phaser.GameObjects.Graphics;
  private pauseLabel!: Phaser.GameObjects.Text;
  private fireballButton!: Phaser.GameObjects.Graphics;
  private fireballLabel!: Phaser.GameObjects.Text;
  private sellButton!: Phaser.GameObjects.Graphics;
  private sellLabel!: Phaser.GameObjects.Text;
  private waveButton!: Phaser.GameObjects.Graphics;
  private waveLabel!: Phaser.GameObjects.Text;
  private pauseIcon!: Phaser.GameObjects.Graphics;
  private paused = false;
  private tooltipBg!: Phaser.GameObjects.Graphics;
  private tooltipText!: Phaser.GameObjects.Text;

  constructor() {
    super('UI');
  }

  init() {
    this.paused = false;
    this.buttons.clear();
  }

  private slotX(index: number): number {
    return MARGIN + index * (BUTTON_WIDTH + GAP) + BUTTON_WIDTH / 2;
  }

  create() {
    this.add
      .rectangle(0, HUD_BAR_HEIGHT + BOARD_HEIGHT, BOARD_WIDTH, UI_BAR_HEIGHT, 0x232320)
      .setOrigin(0, 0);

    const towerTypes = Object.keys(TOWER_TYPES) as TowerType[];
    const y = HUD_BAR_HEIGHT + BOARD_HEIGHT + UI_BAR_HEIGHT / 2;

    towerTypes.forEach((type, index) => {
      const def = TOWER_TYPES[type];
      const x = this.slotX(index);

      const button = createButton(this, x, y, BUTTON_WIDTH, BUTTON_HEIGHT);
      setButtonFill(button, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_COLOR);
      addPressAnimation(this, button);

      const icon = this.add.graphics().setPosition(x, y);
      drawTowerIcon(icon, 0, ICON_OFFSET_Y, def.color);

      this.add
        .text(x, y + LABEL_OFFSET_Y, def.label, {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5);

      button.on('pointerdown', () => {
        this.registry.set('selectedTowerType', type);
        this.registry.set('fireballArmed', false);
        this.registry.set('sellArmed', false);
      });

      this.addTooltip(button, x, () => towerTooltipLines(def));

      this.buttons.set(type, button);
    });

    if (!this.registry.get('selectedTowerType')) {
      this.registry.set('selectedTowerType', 'arrow' satisfies TowerType);
    }

    this.refreshSelection();
    this.registry.events.on('changedata-selectedTowerType', () => this.refreshSelection());

    // Index 3 - sell (grouped with the tower-buying buttons).
    const sellX = this.slotX(3);
    this.sellButton = createButton(this, sellX, y, BUTTON_WIDTH, BUTTON_HEIGHT);
    setButtonFill(this.sellButton, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_COLOR);
    addPressAnimation(this, this.sellButton);
    const sellIcon = this.add.graphics().setPosition(sellX, y);
    drawCoinIcon(sellIcon, 0, ICON_OFFSET_Y);

    this.sellLabel = this.add
      .text(sellX, y + LABEL_OFFSET_Y, '', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: BUTTON_WIDTH - 6 },
      })
      .setOrigin(0.5);

    this.sellButton.on('pointerdown', () => {
      const armed = (this.registry.get('sellArmed') as boolean | undefined) ?? false;
      this.registry.set('sellArmed', !armed);
      if (!armed) {
        this.registry.set('fireballArmed', false);
      }
    });

    this.addTooltip(this.sellButton, sellX, () => [
      'Sell',
      'Sells a tower for 50% of its cost.',
      'Click to arm, then click a tower on the board.',
    ]);

    // Index 4 - fireball.
    const fireballX = this.slotX(4);
    this.fireballButton = createButton(this, fireballX, y, BUTTON_WIDTH, BUTTON_HEIGHT);
    setButtonFill(this.fireballButton, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_COLOR);
    addPressAnimation(this, this.fireballButton);
    const fireballIcon = this.add.graphics().setPosition(fireballX, y);
    drawFireballIcon(fireballIcon, 0, ICON_OFFSET_Y);

    this.fireballLabel = this.add
      .text(fireballX, y + LABEL_OFFSET_Y, '', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: BUTTON_WIDTH - 6 },
      })
      .setOrigin(0.5);

    this.fireballButton.on('pointerdown', () => {
      const cooldownMs = (this.registry.get('fireballCooldownMs') as number | undefined) ?? 0;
      if (cooldownMs > 0) return;
      const armed = (this.registry.get('fireballArmed') as boolean | undefined) ?? false;
      this.registry.set('fireballArmed', !armed);
      if (!armed) {
        this.registry.set('sellArmed', false);
      }
    });

    this.addTooltip(this.fireballButton, fireballX, () => [
      'Fireball',
      `Deals ${FIREBALL.damage} damage in an ${FIREBALL.radius}px radius.`,
      `Cooldown: ${FIREBALL.cooldownMs / 1000}s. Click to arm, then click the board.`,
    ]);

    // Index 5 - call/start wave (grouped with pause).
    const waveX = this.slotX(5);
    this.waveButton = createButton(this, waveX, y, BUTTON_WIDTH, BUTTON_HEIGHT);
    setButtonFill(this.waveButton, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_COLOR);
    addPressAnimation(this, this.waveButton);

    const waveIcon = this.add.graphics().setPosition(waveX, y);
    drawFlagIcon(waveIcon, 0, ICON_OFFSET_Y);

    this.waveLabel = this.add
      .text(waveX, y + LABEL_OFFSET_Y, '', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: BUTTON_WIDTH - 6 },
      })
      .setOrigin(0.5);

    this.waveButton.on('pointerdown', () => {
      const game = this.scene.get('Game') as Game;
      const started = !!this.registry.get('waveStarted');
      if (!started) {
        game.startGame();
      } else if (this.registry.get('waveBreakActive')) {
        game.skipWaveBreak();
      }
    });

    this.addTooltip(this.waveButton, waveX, () => [
      'Wave',
      'Starts the next wave of enemies.',
      'During a break, click again to skip early for a gold bonus.',
    ]);

    // Index 6 - pause.
    const pauseX = this.slotX(6);
    this.pauseButton = createButton(this, pauseX, y, BUTTON_WIDTH, BUTTON_HEIGHT);
    setButtonFill(this.pauseButton, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_COLOR);
    addPressAnimation(this, this.pauseButton);
    this.pauseIcon = this.add.graphics().setPosition(pauseX, y);
    drawPauseIcon(this.pauseIcon, 0, ICON_OFFSET_Y);

    this.pauseLabel = this.add
      .text(pauseX, y + LABEL_OFFSET_Y, 'Pause', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.pauseButton.on('pointerdown', () => {
      this.paused = !this.paused;
      if (this.paused) {
        this.scene.pause('Game');
      } else {
        this.scene.resume('Game');
      }
      this.refreshPause();
    });

    this.addTooltip(this.pauseButton, pauseX, () => ['Pause', 'Pauses or resumes the game.']);

    // Tooltip panel - created last so it renders above all buttons.
    this.tooltipBg = this.add.graphics().setDepth(99).setVisible(false);
    this.tooltipText = this.add
      .text(0, 0, '', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#ffffff',
        align: 'left',
        lineSpacing: 4,
        wordWrap: { width: BOARD_WIDTH - MARGIN * 2 - TOOLTIP_PADDING * 2 },
      })
      .setOrigin(0, 0)
      .setDepth(100)
      .setVisible(false);

    this.events.on('update', () => {
      this.refreshFireball();
      this.refreshSell();
      this.refreshWaveButton();
    });
  }

  /** Shows a floating tooltip above the board when hovering over a button. */
  private addTooltip(button: Phaser.GameObjects.Graphics, x: number, getLines: () => string[]) {
    button.on('pointerover', () => this.showTooltip(x, getLines()));
    button.on('pointerout', () => this.hideTooltip());
  }

  private showTooltip(x: number, lines: string[]) {
    this.tooltipText.setText(lines.join('\n'));
    this.tooltipText.setVisible(true);
    this.tooltipBg.setVisible(true);

    const width = this.tooltipText.width + TOOLTIP_PADDING * 2;
    const height = this.tooltipText.height + TOOLTIP_PADDING * 2;
    const bottom = HUD_BAR_HEIGHT + BOARD_HEIGHT - 6;
    const left = Phaser.Math.Clamp(x - width / 2, 4, BOARD_WIDTH - width - 4);
    const top = bottom - height;

    this.tooltipBg.clear();
    this.tooltipBg.fillStyle(TOOLTIP_BG_COLOR, 0.95);
    this.tooltipBg.fillRoundedRect(left, top, width, height, 8);
    this.tooltipBg.lineStyle(1.5, 0xffffff, 0.2);
    this.tooltipBg.strokeRoundedRect(left, top, width, height, 8);

    this.tooltipText.setPosition(left + TOOLTIP_PADDING, top + TOOLTIP_PADDING);
  }

  private hideTooltip() {
    this.tooltipBg.setVisible(false);
    this.tooltipText.setVisible(false);
  }

  private refreshFireball() {
    const cooldownMs = (this.registry.get('fireballCooldownMs') as number | undefined) ?? 0;
    const armed = (this.registry.get('fireballArmed') as boolean | undefined) ?? false;

    if (cooldownMs > 0) {
      const seconds = Math.ceil(cooldownMs / 1000);
      this.fireballLabel.setText(`${seconds}s`);
      setButtonFill(this.fireballButton, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_DISABLED_COLOR);
    } else if (armed) {
      this.fireballLabel.setText('Target?');
      setButtonFill(this.fireballButton, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_ARMED_COLOR);
    } else {
      this.fireballLabel.setText('Fireball');
      setButtonFill(this.fireballButton, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_COLOR);
    }
  }

  private refreshSell() {
    const armed = (this.registry.get('sellArmed') as boolean | undefined) ?? false;
    if (armed) {
      this.sellLabel.setText('Selling…');
      setButtonFill(this.sellButton, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_ARMED_COLOR);
    } else {
      this.sellLabel.setText('Sell');
      setButtonFill(this.sellButton, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_COLOR);
    }
  }

  private refreshWaveButton() {
    const started = !!this.registry.get('waveStarted');
    const breakActive = !!this.registry.get('waveBreakActive');

    if (!started) {
      this.waveLabel.setText('Wave 1');
      setButtonFill(this.waveButton, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_SELECTED_COLOR);
    } else if (breakActive) {
      const remainingMs = (this.registry.get('waveBreakRemainingMs') as number | undefined) ?? 0;
      const bonus = (this.registry.get('waveBreakBonus') as number | undefined) ?? 0;
      const seconds = Math.ceil(remainingMs / 1000);
      this.waveLabel.setText(`+${bonus}g (${seconds}s)`);
      setButtonFill(this.waveButton, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_ARMED_COLOR);
    } else {
      this.waveLabel.setText('Running');
      setButtonFill(this.waveButton, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_DISABLED_COLOR);
    }
  }

  private refreshPause() {
    this.pauseIcon.clear();
    if (this.paused) {
      drawPlayIcon(this.pauseIcon, 0, ICON_OFFSET_Y);
      this.pauseLabel.setText('Resume');
    } else {
      drawPauseIcon(this.pauseIcon, 0, ICON_OFFSET_Y);
      this.pauseLabel.setText('Pause');
    }
  }

  private refreshSelection() {
    const selected = this.registry.get('selectedTowerType') as TowerType | undefined;
    for (const [type, button] of this.buttons) {
      setButtonFill(button, BUTTON_WIDTH, BUTTON_HEIGHT, type === selected ? BUTTON_SELECTED_COLOR : BUTTON_COLOR);
    }
  }
}
