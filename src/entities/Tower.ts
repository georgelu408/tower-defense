import Phaser from 'phaser';
import type { TowerDef } from '../config/towers';
import type { Cell } from '../config/level';

export class Tower extends Phaser.GameObjects.Container {
  public readonly cell: Cell;
  public readonly def: TowerDef;
  private rangeCircle: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, cell: Cell, worldPos: { x: number; y: number }, def: TowerDef) {
    super(scene, worldPos.x, worldPos.y);
    this.cell = cell;
    this.def = def;

    this.rangeCircle = scene.add.circle(0, 0, def.range, 0xffffff, 0.08);
    this.rangeCircle.setStrokeStyle(1, 0xffffff, 0.25);

    const body = scene.add.circle(0, 0, def.radius, def.color);

    this.add([this.rangeCircle, body]);
    scene.add.existing(this);
  }
}
