import React from 'react'
import { Sprite } from '@pixi/react'
import { type Texture } from 'pixi.js'
import { type Item } from '@src/types/Item'
import { getJunkTexture, textures } from '@src/utils/textures'
import { toPixelPosition } from '@src/utils/toPixelPosition'
import { zIndex } from '@src/utils/zIndex'

function getItemTexture ({ type, position }: Item, showBeer: boolean): Texture {
  if (type === 'WEAPON') {
    return textures.weapon
  }

  if (type === 'POTION') {
    return showBeer ? textures.beer : textures.potion
  }

  return getJunkTexture(position.x, position.y)
}

export function MapItem ({
  item,
  tileWidth,
  halfTileWidth,
  showBeer
}: {
  item: Item
  tileWidth: number
  halfTileWidth: number
  showBeer: boolean
}): JSX.Element {
  const texture = getItemTexture(item, showBeer)
  const itemPosition = toPixelPosition(item.position, tileWidth, halfTileWidth)

  return <Sprite
    anchor={[0.5, 0.5]}
    x={itemPosition.xInPx}
    y={itemPosition.yInPx}
    width={tileWidth}
    height={tileWidth}
    texture={texture}
    zIndex={zIndex.item}
  />
}
