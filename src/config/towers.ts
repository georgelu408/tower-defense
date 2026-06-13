export interface TowerDef {
  range: number; // pixels
  fireRate: number; // shots per second
  damage: number;
  cost: number;
  radius: number;
  color: number;
  damageType: 'single' | 'splash';
  splashRadius?: number;
  label: string;
}

export const TOWER_TYPES = {
  arrow: {
    range: 140,
    fireRate: 1,
    damage: 5,
    cost: 50,
    radius: 14,
    color: 0x378add,
    damageType: 'single',
    label: 'Arrow',
  },
  cannon: {
    range: 110,
    fireRate: 0.6,
    damage: 8,
    cost: 100,
    radius: 16,
    color: 0xd85a30,
    damageType: 'splash',
    splashRadius: 55,
    label: 'Cannon',
  },
} as const satisfies Record<string, TowerDef>;

export type TowerType = keyof typeof TOWER_TYPES;
