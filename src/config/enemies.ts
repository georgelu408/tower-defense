export interface EnemyTypeDef {
  hpMultiplier: number;
  speedMultiplier: number;
  radius: number;
  color: number;
  armor: number;
  goldMultiplier: number;
}

export const BASE_SPEED = 80; // pixels per second, at speedMultiplier 1

export const ENEMY_TYPES = {
  grunt: {
    hpMultiplier: 1,
    speedMultiplier: 1,
    radius: 12,
    color: 0xd4537e,
    armor: 0,
    goldMultiplier: 1,
  },
  tank: {
    hpMultiplier: 2,
    speedMultiplier: 0.7,
    radius: 16,
    color: 0x7f77dd,
    armor: 3,
    goldMultiplier: 1.5,
  },
  fast: {
    hpMultiplier: 0.5,
    speedMultiplier: 1.8,
    radius: 9,
    color: 0xf2c14e,
    armor: 0,
    goldMultiplier: 0.75,
  },
} as const satisfies Record<string, EnemyTypeDef>;

export type EnemyType = keyof typeof ENEMY_TYPES;

export interface EnemySpec {
  hp: number;
  speed: number;
  radius: number;
  color: number;
  goldReward: number;
  armor: number;
}

export function resolveEnemySpec(type: EnemyType, baseHP: number, goldReward: number): EnemySpec {
  const def = ENEMY_TYPES[type];
  return {
    hp: Math.round(baseHP * def.hpMultiplier),
    speed: BASE_SPEED * def.speedMultiplier,
    radius: def.radius,
    color: def.color,
    goldReward: Math.round(goldReward * def.goldMultiplier),
    armor: def.armor,
  };
}
