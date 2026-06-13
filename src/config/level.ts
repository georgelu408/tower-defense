export interface Cell {
  col: number;
  row: number;
}

// Path from spawn (left edge) to base (right edge), in grid cells.
export const PATH: Cell[] = [
  { col: 0, row: 3 },
  { col: 1, row: 3 },
  { col: 2, row: 3 },
  { col: 3, row: 3 },
  { col: 4, row: 3 },
  { col: 5, row: 3 },
  { col: 6, row: 3 },
  { col: 7, row: 3 },
  { col: 8, row: 3 },
  { col: 9, row: 3 },
  { col: 9, row: 4 },
  { col: 9, row: 5 },
  { col: 9, row: 6 },
  { col: 10, row: 6 },
  { col: 11, row: 6 },
  { col: 12, row: 6 },
  { col: 13, row: 6 },
  { col: 14, row: 6 },
  { col: 15, row: 6 },
];

export const SPAWN: Cell = PATH[0];
export const BASE: Cell = PATH[PATH.length - 1];
