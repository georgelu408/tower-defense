import Phaser from 'phaser';
import type { TowerDef } from '../config/towers';
import type { Cell } from '../config/level';
import type { Enemy } from './Enemy';
import { Projectile } from './Projectile';

export class Tower extends Phaser.GameObjects.Container {
  public readonly cell: Cell;
  public readonly def: TowerDef;
  private rangeCircle: Phaser.GameObjects.Arc;
  private cooldown = 0;

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

  /** Advances the fire cooldown and returns a new projectile if it fired this frame. */
  update(deltaSeconds: number, enemies: Enemy[]): Projectile | null {
    this.cooldown = Math.max(0, this.cooldown - deltaSeconds);
    if (this.cooldown > 0) return null;

    const target = this.findTarget(enemies);
    if (!target) return null;

    this.cooldown = 1 / this.def.fireRate;
    return new Projectile(this.scene, { x: this.x, y: this.y }, target, this.def.damage);
  }

  private findTarget(enemies: Enemy[]): Enemy | null {
    let closest: Enemy | null = null;
    let closestDistance = this.def.range;

    for (const enemy of enemies) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (distance <= closestDistance) {
        closest = enemy;
        closestDistance = distance;
      }
    }

    return closest;
  }
}
