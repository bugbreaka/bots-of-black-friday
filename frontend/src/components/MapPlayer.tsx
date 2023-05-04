import React from 'react'
import { Sprite } from '@pixi/react'
import { type Texture } from 'pixi.js'
import { pickByString } from '@src/utils/pickByString'
import { toPixelPosition } from '@src/utils/toPixelPosition'
import { zIndex } from '@src/utils/zIndex'
import { type Player } from '@src/types/Player'

// https://www.pixilart.com/palettes/tropical-1333
export const playerTints = [
  0x991B4B,
  0xE15365,
  0xFFA472,
  0xFFDC8A,
  0xFEFFF0,
  0xAFE06E,
  0x21DB81
]

export function getPlayerTint (name: string): number {
  return pickByString(name, playerTints)
}

export function MapPlayer ({
  player,
  tileWidth,
  halfTileWidth,
  texture,
  tint
}: {
  player: Player
  tileWidth: number
  halfTileWidth: number
  texture: Texture
  tint: number
}): JSX.Element {
  const playerPosition = toPixelPosition(player.position, tileWidth, halfTileWidth)

  return <Sprite
    anchor={[0.5, 0.5]}
    x={playerPosition.xInPx}
    y={playerPosition.yInPx}
    width={tileWidth}
    height={tileWidth}
    texture={texture}
    tint={tint}
    zIndex={zIndex.player}
  />
}
