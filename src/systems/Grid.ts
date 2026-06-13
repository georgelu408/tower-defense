import { GRID_SIZE } from '../config/constants';
import type { Cell } from '../config/level';

export function cellToWorld(cell: Cell): { x: number; y: number } {
  return {
    x: cell.col * GRID_SIZE + GRID_SIZE / 2,
    y: cell.row * GRID_SIZE + GRID_SIZE / 2,
  };
}

export function worldToCell(x: number, y: number): Cell {
  return {
    col: Math.floor(x / GRID_SIZE),
    row: Math.floor(y / GRID_SIZE),
  };
}

export function cellKey(cell: Cell): string {
  return `${cell.col},${cell.row}`;
}
