import React from 'react'
import { Container, Sprite, TilingSprite } from '@pixi/react'
import { type Texture } from 'pixi.js'
import { type GameMap } from '@src/types/GameMap'
import { type MapDimensions } from '@src/utils/MapDimensions'
import { textures } from '@src/utils/textures'

enum TileType {
  WALL = 'x',
  EXIT = 'o',
  MINE = '#',
  FLOOR = '_'
}

export function MapStaticContent ({
  gameMap: {
    tiles
  },
  dimensions: {
    tileWidth,
    stageWidth,
    stageHeight
  }
}: {
  gameMap: GameMap
  dimensions: MapDimensions
}): JSX.Element {
  // Note! Floor texture is 1024 px times 1024 px and contains 12 tiles
  const floorTileScale = (tileWidth / (textures.floor.width / 12))

  const mapStaticSprites = tiles.map((row, rowIndex): JSX.Element[] => {
    const rowSprites = [...row]
      .map((tileType, colIndex) => {
        let texture: Texture
        if (tileType === TileType.WALL) {
          texture = textures.wall
        } else if (tileType === TileType.MINE) {
          texture = textures.mine
        } else if (tileType === TileType.EXIT) {
          texture = textures.exit
        } else if (tileType === TileType.FLOOR) {
          return null
        } else {
          console.error(`Unknown tile type (${tileType}) at (${rowIndex}, ${colIndex}).`)
          return null
        }
        const x = colIndex * tileWidth
        const y = rowIndex * tileWidth

        return <Sprite
          key={`wall-${rowIndex}-${colIndex}`}
          x={x}
          y={y}
          width={tileWidth}
          height={tileWidth}
          texture={texture}
        />
      }).filter((sprite): sprite is JSX.Element => sprite !== null)

    return rowSprites
  }).filter((sprite) => sprite.length > 0)

  return (
    <>
      <TilingSprite
        key="map-floor"
        texture={textures.floor}
        width={stageWidth}
        height={stageHeight}
        tileScale={[floorTileScale, floorTileScale]}
        tilePosition={{ x: 0, y: 0 }}
      />
      <Container key="map-static" position={[0, 0]}>
        {mapStaticSprites}
      </Container>
    </>
  )
}
