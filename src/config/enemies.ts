export interface EnemyDef {
  speed: number; // pixels per second
  hp: number;
  radius: number;
  color: number;
  goldReward: number;
}

export const ENEMY_TYPES = {
  grunt: {
    speed: 80,
    hp: 10,
    radius: 12,
    color: 0xd4537e,
    goldReward: 5,
  },
} as const satisfies Record<string, EnemyDef>;

export type EnemyType = keyof typeof ENEMY_TYPES;
