import Phaser from 'phaser';
import type { EnemySpec } from '../config/enemies';

const HP_BAR_OFFSET = 8;
const HP_BAR_HEIGHT = 4;

export class Enemy extends Phaser.GameObjects.Container {
  private waypoints: { x: number; y: number }[];
  private waypointIndex = 1;
  private baseSpeed: number;
  private slowMultiplier = 1;
  private slowTimer = 0;
  private hpBarWidth: number;
  private hpBarFill: Phaser.GameObjects.Rectangle;
  public reachedBase = false;
  public hp: number;
  public readonly maxHp: number;
  public readonly goldReward: number;
  public readonly armor: number;
  public isDead = false;
  /** Cumulative distance traveled along the path, used to find the enemy closest to the base. */
  public pathProgress = 0;
  public readonly color: number;
  public readonly radius: number;
  private hitFlash: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, waypoints: { x: number; y: number }[], spec: EnemySpec) {
    const start = waypoints[0];
    super(scene, start.x, start.y);
    this.waypoints = waypoints;
    this.baseSpeed = spec.speed;
    this.hp = spec.hp;
    this.maxHp = spec.hp;
    this.goldReward = spec.goldReward;
    this.armor = spec.armor;
    this.color = spec.color;
    this.radius = spec.radius;

    const body = scene.add.circle(0, 0, spec.radius, spec.color);
    this.hitFlash = scene.add.circle(0, 0, spec.radius, 0xffffff, 0);
    this.hpBarWidth = spec.radius * 2;
    const barY = -spec.radius - HP_BAR_OFFSET;
    const hpBarBg = scene.add
      .rectangle(0, barY, this.hpBarWidth, HP_BAR_HEIGHT, 0x000000, 0.6)
      .setOrigin(0.5, 0.5);
    this.hpBarFill = scene.add
      .rectangle(-this.hpBarWidth / 2, barY, this.hpBarWidth, HP_BAR_HEIGHT, 0x4ade80)
      .setOrigin(0, 0.5);

    this.add([body, this.hitFlash, hpBarBg, this.hpBarFill]);
    scene.add.existing(this);
  }

  update(deltaSeconds: number) {
    if (this.reachedBase) return;

    if (this.slowTimer > 0) {
      this.slowTimer -= deltaSeconds;
      if (this.slowTimer <= 0) {
        this.slowMultiplier = 1;
      }
    }

    const target = this.waypoints[this.waypointIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy);
    const step = this.baseSpeed * this.slowMultiplier * deltaSeconds;

    if (step >= distance) {
      this.x = target.x;
      this.y = target.y;
      this.pathProgress += distance;
      this.waypointIndex++;
      if (this.waypointIndex >= this.waypoints.length) {
        this.reachedBase = true;
      }
    } else {
      this.x += (dx / distance) * step;
      this.y += (dy / distance) * step;
      this.pathProgress += step;
    }
  }

  applySlow(multiplier: number, durationMs: number) {
    this.slowMultiplier = multiplier;
    this.slowTimer = durationMs / 1000;
  }

  takeDamage(amount: number, damageType: 'single' | 'splash') {
    const effective = damageType === 'single' ? Math.max(1, amount - this.armor) : amount;
    this.hp -= effective;
    if (this.hp <= 0) {
      this.isDead = true;
    }
    this.hpBarFill.width = this.hpBarWidth * Math.max(0, this.hp / this.maxHp);

    this.hitFlash.setAlpha(0.7);
    this.scene.tweens.add({
      targets: this.hitFlash,
      alpha: 0,
      duration: 120,
    });
  }
}
