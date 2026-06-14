export interface Cell {
  col: number;
  row: number;
}

// Snaking path from spawn (left edge) to base (right edge), in grid cells.
// Three horizontal lanes (rows 1, 3, 5) connected by vertical runs at the
// right edge (col 14) and left edge (col 1), giving towers placed between
// lanes multiple chances to hit passing enemies.
export const PATH: Cell[] = [
  // Lane 1: left to right along row 1
  { col: 0, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 3, row: 1 },
  { col: 4, row: 1 },
  { col: 5, row: 1 },
  { col: 6, row: 1 },
  { col: 7, row: 1 },
  { col: 8, row: 1 },
  { col: 9, row: 1 },
  { col: 10, row: 1 },
  { col: 11, row: 1 },
  { col: 12, row: 1 },
  { col: 13, row: 1 },
  { col: 14, row: 1 },
  // Connector down to lane 2
  { col: 14, row: 2 },
  { col: 14, row: 3 },
  // Lane 2: right to left along row 3
  { col: 13, row: 3 },
  { col: 12, row: 3 },
  { col: 11, row: 3 },
  { col: 10, row: 3 },
  { col: 9, row: 3 },
  { col: 8, row: 3 },
  { col: 7, row: 3 },
  { col: 6, row: 3 },
  { col: 5, row: 3 },
  { col: 4, row: 3 },
  { col: 3, row: 3 },
  { col: 2, row: 3 },
  { col: 1, row: 3 },
  // Connector down to lane 3
  { col: 1, row: 4 },
  { col: 1, row: 5 },
  // Lane 3: left to right along row 5
  { col: 2, row: 5 },
  { col: 3, row: 5 },
  { col: 4, row: 5 },
  { col: 5, row: 5 },
  { col: 6, row: 5 },
  { col: 7, row: 5 },
  { col: 8, row: 5 },
  { col: 9, row: 5 },
  { col: 10, row: 5 },
  { col: 11, row: 5 },
  { col: 12, row: 5 },
  { col: 13, row: 5 },
  { col: 14, row: 5 },
  // Connector down to base
  { col: 14, row: 6 },
  { col: 15, row: 6 },
];

export const SPAWN: Cell = PATH[0];
export const BASE: Cell = PATH[PATH.length - 1];
