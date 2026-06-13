export interface EnemyDef {
  speed: number; // pixels per second
  hp: number;
  radius: number;
  color: number;
}

export const ENEMY_TYPES = {
  grunt: {
    speed: 80,
    hp: 10,
    radius: 12,
    color: 0xd4537e,
  },
} as const satisfies Record<string, EnemyDef>;

export type EnemyType = keyof typeof ENEMY_TYPES;
