export interface TowerDef {
  range: number; // pixels
  fireRate: number; // shots per second
  damage: number;
  cost: number;
  radius: number;
  color: number;
}

export const TOWER_TYPES = {
  arrow: {
    range: 140,
    fireRate: 1,
    damage: 5,
    cost: 50,
    radius: 14,
    color: 0x378add,
  },
} as const satisfies Record<string, TowerDef>;

export type TowerType = keyof typeof TOWER_TYPES;
