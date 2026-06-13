import Phaser from 'phaser';
import type { Enemy } from './Enemy';
import type { TowerDef } from '../config/towers';

const SPEED = 400; // pixels per second
const RADIUS = 4;
const HIT_DISTANCE = 6;

export class Projectile extends Phaser.GameObjects.Arc {
  public readonly target: Enemy;
  public readonly def: TowerDef;
  public spent = false;

  constructor(scene: Phaser.Scene, origin: { x: number; y: number }, target: Enemy, def: TowerDef) {
    super(scene, origin.x, origin.y, RADIUS, 0, 360, false, def.projectileColor);
    this.target = target;
    this.def = def;
    scene.add.existing(this);
  }

  update(deltaSeconds: number, enemies: Enemy[]) {
    if (this.spent) return;

    if (this.target.isDead) {
      this.spent = true;
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= HIT_DISTANCE) {
      this.applyDamage(enemies);
      this.spent = true;
      return;
    }

    const step = SPEED * deltaSeconds;
    this.x += (dx / distance) * step;
    this.y += (dy / distance) * step;
  }

  private applyDamage(enemies: Enemy[]) {
    if (this.def.damageType === 'single' || !this.def.splashRadius) {
      this.target.takeDamage(this.def.damage, 'single');
      if (this.def.slow) {
        this.target.applySlow(this.def.slow.multiplier, this.def.slow.durationMs);
      }
      return;
    }

    for (const enemy of enemies) {
      const distance = Phaser.Math.Distance.Between(this.target.x, this.target.y, enemy.x, enemy.y);
      if (distance <= this.def.splashRadius) {
        enemy.takeDamage(this.def.damage, 'splash');
        if (this.def.slow) {
          enemy.applySlow(this.def.slow.multiplier, this.def.slow.durationMs);
        }
      }
    }
  }
}
