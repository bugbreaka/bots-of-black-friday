import { type Position } from '@src/types/Position'

export interface PixelPosition {
  xInPx: number
  yInPx: number
}

export function toPixelPosition ({ x, y }: Position, tileWidth: number, halfTileWidth: number): PixelPosition {
  return {
    xInPx: (x * tileWidth) + halfTileWidth,
    yInPx: (y * tileWidth) + halfTileWidth
  }
}
