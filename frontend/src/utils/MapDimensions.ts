import { type Result } from '@src/utils/Result'
import { type GameMap } from '@src/types/GameMap'

export interface MapDimensions {
  containerWidth: number
  tileWidth: number
  halfTileWidth: number
  stageWidth: number
  stageHeight: number
}

export function calculateMapDimensions (
  gameMap: Result<GameMap>,
  containerWidth: number | undefined
): MapDimensions | undefined {
  if (!gameMap.ok) {
    return
  }

  if (containerWidth === undefined) {
    return
  }

  const tileWidth = Math.floor(containerWidth / gameMap.value.width)

  return {
    containerWidth,
    tileWidth,
    halfTileWidth: Math.round(tileWidth / 2),
    stageWidth: gameMap.value.width * tileWidth,
    stageHeight: gameMap.value.height * tileWidth
  }
}
