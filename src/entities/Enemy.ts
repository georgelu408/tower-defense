import Phaser from 'phaser';
import type { EnemyDef } from '../config/enemies';

export class Enemy extends Phaser.GameObjects.Arc {
  private waypoints: { x: number; y: number }[];
  private waypointIndex = 1;
  private speed: number;
  public reachedBase = false;

  constructor(scene: Phaser.Scene, waypoints: { x: number; y: number }[], def: EnemyDef) {
    const start = waypoints[0];
    super(scene, start.x, start.y, def.radius, 0, 360, false, def.color);
    this.waypoints = waypoints;
    this.speed = def.speed;
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
}
