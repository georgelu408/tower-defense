import Phaser from 'phaser';
import type { Enemy } from './Enemy';

const SPEED = 400; // pixels per second
const RADIUS = 4;
const COLOR = 0xffffff;
const HIT_DISTANCE = 6;

export class Projectile extends Phaser.GameObjects.Arc {
  public readonly target: Enemy;
  public readonly damage: number;
  public spent = false;

  constructor(scene: Phaser.Scene, origin: { x: number; y: number }, target: Enemy, damage: number) {
    super(scene, origin.x, origin.y, RADIUS, 0, 360, false, COLOR);
    this.target = target;
    this.damage = damage;
    scene.add.existing(this);
  }

  update(deltaSeconds: number) {
    if (this.spent) return;

    if (this.target.isDead) {
      this.spent = true;
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= HIT_DISTANCE) {
      this.target.takeDamage(this.damage);
      this.spent = true;
      return;
    }

    const step = SPEED * deltaSeconds;
    this.x += (dx / distance) * step;
    this.y += (dy / distance) * step;
  }
}
