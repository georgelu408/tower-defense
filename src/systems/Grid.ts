import { GRID_SIZE } from '../config/constants';
import type { Cell } from '../config/level';

export function cellToWorld(cell: Cell): { x: number; y: number } {
  return {
    x: cell.col * GRID_SIZE + GRID_SIZE / 2,
    y: cell.row * GRID_SIZE + GRID_SIZE / 2,
  };
}
