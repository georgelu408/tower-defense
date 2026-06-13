import Phaser from 'phaser';
import type { EnemySpec } from '../config/enemies';

export class Enemy extends Phaser.GameObjects.Arc {
  private waypoints: { x: number; y: number }[];
  private waypointIndex = 1;
  private speed: number;
  public reachedBase = false;
  public hp: number;
  public readonly goldReward: number;
  public isDead = false;

  constructor(scene: Phaser.Scene, waypoints: { x: number; y: number }[], spec: EnemySpec) {
    const start = waypoints[0];
    super(scene, start.x, start.y, spec.radius, 0, 360, false, spec.color);
    this.waypoints = waypoints;
    this.speed = spec.speed;
    this.hp = spec.hp;
    this.goldReward = spec.goldReward;
    scene.add.existing(this);
  }

  update(deltaSeconds: number) {
    if (this.reachedBase) return;

    const target = this.waypoints[this.waypointIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy);
    const step = this.speed * deltaSeconds;

    if (step >= distance) {
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex++;
      if (this.waypointIndex >= this.waypoints.length) {
        this.reachedBase = true;
      }
    } else {
      this.x += (dx / distance) * step;
      this.y += (dy / distance) * step;
    }
  }

  takeDamage(amount: number) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.isDead = true;
    }
  }
}
