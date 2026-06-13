export interface TowerDef {
  range: number; // pixels
  fireRate: number; // shots per second
  damage: number;
  cost: number;
  radius: number;
  color: number;
  projectileColor: number;
  damageType: 'single' | 'splash';
  splashRadius?: number;
  slow?: { multiplier: number; durationMs: number };
  label: string;
  description: string;
}

export const TOWER_TYPES = {
  arrow: {
    range: 90,
    fireRate: 2,
    damage: 10,
    cost: 50,
    radius: 14,
    color: 0x378add,
    projectileColor: 0xffffff,
    damageType: 'single',
    label: 'Arrow',
    description: 'Fires quickly, low damage',
  },
  cannon: {
    range: 80,
    fireRate: 0.5,
    damage: 20,
    cost: 100,
    radius: 16,
    color: 0xd85a30,
    projectileColor: 0xf0997b,
    damageType: 'splash',
    splashRadius: 55,
    label: 'Cannon',
    description: 'Fires slowly, splash damage',
  },
  slow: {
    range: 85,
    fireRate: 1,
    damage: 5,
    cost: 75,
    radius: 14,
    color: 0x59c8d8,
    projectileColor: 0xbdf2ff,
    damageType: 'single',
    slow: { multiplier: 0.5, durationMs: 1500 },
    label: 'Slow',
    description: 'Slows enemies on hit',
  },
} as const satisfies Record<string, TowerDef>;

export type TowerType = keyof typeof TOWER_TYPES;
