import type { Cell } from './level';

// Fixed build slots flanking the snake path, giving players a limited set of
// placements to plan around instead of an open grid.
export const BUILD_SLOTS: Cell[] = [
  { col: 2, row: 2 },
  { col: 5, row: 2 },
  { col: 8, row: 2 },
  { col: 11, row: 2 },
  { col: 3, row: 4 },
  { col: 6, row: 4 },
  { col: 9, row: 4 },
  { col: 12, row: 4 },
  { col: 13, row: 0 },
  { col: 1, row: 0 },
  { col: 12, row: 6 },
  { col: 2, row: 6 },
];
