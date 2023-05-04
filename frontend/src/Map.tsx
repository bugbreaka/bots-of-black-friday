import React, { useCallback } from 'react'
import { Container, Graphics, NineSlicePlane, Sprite, Stage, Text, TilingSprite } from '@pixi/react'
import { AlphaFilter, type Filter, SCALE_MODES, TextMetrics, TextStyle, Texture } from 'pixi.js'
import { type Graphics as PixiGraphics } from '@pixi/graphics'
import { Spring } from '@react-spring/web'
import { Sprite as AnimatedSprite } from '@pixi/react-animated'
import { isNull } from 'lodash'
import { type GameMap } from '@src/types/GameMap'
import { type GameState } from '@src/types/GameState'
import { type Item } from '@src/types/Item'
import { type Position } from '@src/types/Position'
import { pickByString } from '@src/utils/pickByString'
import wallImage from '@src/assets/wall.png'
import floorImage from '@src/assets/floor.jpg'
import mineImage from '@src/assets/mine.png'
import exitImage from '@src/assets/exit.png'
import junkOneImage from '@src/assets/junk-001.png'
import junkTwoImage from '@src/assets/junk-002.png'
import junkThreeImage from '@src/assets/junk-003.png'
import potionImage from '@src/assets/potion.png'
import weaponAxeImage from '@src/assets/weapon-axe.png'
import weaponWandImage from '@src/assets/weapon-wand.png'
import labelImage from '@src/assets/label.png'
import playerOneImage from '@src/assets/player-001.png'
import playerTwoImage from '@src/assets/player-002.png'
import playerThreeImage from '@src/assets/player-003.png'
import playerFourImage from '@src/assets/player-004.png'
import playerFiveImage from '@src/assets/player-005.png'
import energyBallImage from '@src/assets/energyball.png'
import beerImage from '@src/assets/beer.png'

enum TileType {
  WALL = 'x',
  EXIT = 'o',
  MINE = '#',
  FLOOR = '_'
}

const textureOptions = {
  scaleMode: SCALE_MODES.NEAREST
}

const textures = {
  wall: Texture.from(wallImage, textureOptions),
  floor: Texture.from(floorImage, textureOptions),
  mine: Texture.from(mineImage, textureOptions),
  exit: Texture.from(exitImage, textureOptions),
  potion: Texture.from(potionImage, textureOptions),
  weaponAxe: Texture.from(weaponAxeImage, textureOptions),
  weaponWand: Texture.from(weaponWandImage, textureOptions),
  label: Texture.from(labelImage, textureOptions),
  energyBall: Texture.from(energyBallImage, textureOptions),
  beer: Texture.from(beerImage, textureOptions)
}

const junkTextures = [
  Texture.from(junkOneImage, textureOptions),
  Texture.from(junkTwoImage, textureOptions),
  Texture.from(junkThreeImage, textureOptions)
]

function getJunkTexture (x: number, y: number): Texture {
  return pickByString(`${x}${y}`, junkTextures)
}

const playerTextures = [
  Texture.from(playerOneImage, textureOptions),
  Texture.from(playerTwoImage, textureOptions),
  Texture.from(playerThreeImage, textureOptions),
  Texture.from(playerFourImage, textureOptions),
  Texture.from(playerFiveImage, textureOptions)
]

function getPlayerTexture (name: string): Texture {
  return pickByString(name, playerTextures)
}

// https://www.pixilart.com/palettes/tropical-1333
const playerTints = [
  0x991B4B,
  0xE15365,
  0xFFA472,
  0xFFDC8A,
  0xFEFFF0,
  0xAFE06E,
  0x21DB81
]

function getPlayerTint (name: string): number {
  return pickByString(name, playerTints)
}

const zIndex: Readonly<{
  item: number
  itemLabel: number
  player: number
  projectile: number
  playerLabel: number
}> = {
  item: 10,
  itemLabel: 30,
  player: 20,
  projectile: 25,
  playerLabel: 40
}

/*
TODO
  - hajoita Map pienempiin osiin
  - yksikkötestit canvaksille
  - depsujen päivitys
  - asetukset-modaali? tai sitten käännösaikaiset vivut
*/

const itemLabelFilters = [new AlphaFilter(0.6)]

const playerLabelFilters = [new AlphaFilter(1)]

const labelTextStyle = new TextStyle({
  align: 'center',
  fontFamily: '"Press Start 2P", cursive',
  fontSize: 8,
  letterSpacing: 1.4,
  lineHeight: 10,
  fill: '#000000'
})

type MapItem = Item & {
  itemX: number
  itemY: number
  texture: Texture
  labelText: string | null
  key: string
}

function getWeaponTexture (x: number, y: number): Texture {
  const sum = Math.abs(x + y)
  return sum % 2 === 0 ? textures.weaponWand : textures.weaponAxe
}

function Label ({
  text,
  halfTileWidth,
  itemX,
  itemY,
  zIndex,
  filters
}: {
  text: string
  halfTileWidth: number
  itemX: number
  itemY: number
  zIndex: number
  filters: Filter[]
}): JSX.Element {
  const labelMetrics = TextMetrics.measureText(text, labelTextStyle)

  const labelPadding = 16
  const halfLabelPadding = Math.round(labelPadding / 2)

  const labelWidth = labelMetrics.maxLineWidth + labelPadding
  const labelHeight = labelMetrics.height + labelPadding
  const labelX = itemX + (Math.round(labelWidth / 2) * -1) + halfTileWidth
  const labelY = itemY + (labelHeight * -1) - halfLabelPadding

  const labelContentX = halfLabelPadding
  const labelContentY = halfLabelPadding

  return (
    <Container
      position={[labelX, labelY]}
      filters={filters}
      zIndex={zIndex}
    >
      <NineSlicePlane
        leftWidth={7}
        topHeight={6}
        rightWidth={7}
        bottomHeight={6}
        width={labelWidth}
        height={labelHeight}
        x={0}
        y={0}
        texture={textures.label}
      />
      <Text
        text={text}
        x={labelContentX}
        y={labelContentY}
        style={labelTextStyle}
      />
    </Container>
  )
}

function getItemLabelText ({ type, price, discountPercent }: Item): string | null {
  if (type === 'JUST_SOME_JUNK') {
    return discountPercent > 0 ? `${price} €\n-${discountPercent} %` : `${price} €`
  }

  if (type === 'WEAPON') {
    return `${price} €`
  }

  return null
}

function toPixels ({ x, y }: Position, tileWidth: number, halfTileWidth: number): Position {
  return {
    x: (x * tileWidth) + halfTileWidth,
    y: (y * tileWidth) + halfTileWidth
  }
}

/**
 * Sprite must be oriented originally upwards.
 *
 * @param originX
 * @param originY
 * @param targetX
 * @param targetY
 */
function rotateSpriteToTarget (
  { x: originX, y: originY }: Position,
  { x: targetX, y: targetY }: Position
): number {
  const shiftedOriginX = 0
  const shiftedOriginY = -15
  const shiftedTargetX = targetX - originX
  const shiftedTargetY = targetY - originY

  const angle = Math.atan2((shiftedTargetY * shiftedOriginX) - (shiftedTargetX * shiftedOriginY), (shiftedTargetX * shiftedOriginX) + (shiftedTargetY * shiftedOriginY))
  return angle
}

/**
 * Min and max are inclusive.
 *
 * @param min
 * @param max
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function randomInteger (min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default function Map ({
  gameMap: {
    width,
    height,
    tiles
  },
  gameState: {
    items,
    players,
    shootingLines
  },
  containerWidth,
  showBeer,
  showMapGrid,
  showItemLabels
}: {
  gameMap: GameMap
  gameState: GameState
  containerWidth: number
  showBeer: boolean
  showMapGrid: boolean
  showItemLabels: boolean
}): JSX.Element {
  const drawGrid = useCallback((g: PixiGraphics) => {
    g.clear()
    g.lineStyle(1, 0xD97706, 0.6)

    for (let y = 1; y < height - 1; y++) {
      g.moveTo(0, y * tileWidth)
      g.lineTo(width * tileWidth, y * tileWidth)
    }

    for (let x = 1; x < width - 1; x++) {
      g.moveTo(x * tileWidth, 0)
      g.lineTo(x * tileWidth, height * tileWidth)
    }
  }, [containerWidth, width, height])

  const tileWidth = Math.floor(containerWidth / width)
  const halfTileWidth = Math.round(tileWidth / 2)
  const stageWidth = width * tileWidth
  const stageHeight = height * tileWidth

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

  const mapItems = items.map((item): MapItem | null => {
    const {
      type,
      position: { x, y }
    } = item

    let texture: Texture
    if (type === 'JUST_SOME_JUNK') {
      texture = getJunkTexture(x, y)
    } else if (type === 'WEAPON') {
      texture = getWeaponTexture(x, y)
    } else if (type === 'POTION') {
      texture = showBeer ? textures.beer : textures.potion
    } else {
      return null
    }

    const itemX = x * tileWidth
    const itemY = y * tileWidth

    return {
      ...item,
      texture,
      labelText: getItemLabelText(item),
      itemX,
      itemY,
      key: `${type}-${y}-${x}`
    }
  }).filter((item): item is MapItem => item !== null)

  const mapItemSprites = mapItems.map(({
    key,
    itemX,
    itemY,
    texture
  }) => {
    return <Sprite
      key={`${key}-sprite`}
      x={itemX}
      y={itemY}
      width={tileWidth}
      height={tileWidth}
      texture={texture}
      zIndex={zIndex.item}
    />
  })

  const mapItemLabelSprites = mapItems
    .filter(() => showItemLabels)
    .filter((item): item is MapItem & { labelText: string } => !isNull(item.labelText))
    .map(({
      key,
      itemX,
      itemY,
      labelText
    }) => {
      return <Label
        key={`${key}-label`}
        text={labelText}
        halfTileWidth={halfTileWidth}
        itemX={itemX}
        itemY={itemY}
        filters={itemLabelFilters}
        zIndex={zIndex.itemLabel}
      />
    })

  const playerSprites = players.map(({ name, position: { x, y } }) => {
    const itemX = x * tileWidth
    const itemY = y * tileWidth

    return <Sprite
      key={`player-${name}-sprite`}
      x={itemX}
      y={itemY}
      width={tileWidth}
      height={tileWidth}
      texture={getPlayerTexture(name)}
      tint={getPlayerTint(name)}
      zIndex={zIndex.player}
    />
  })

  const playerLabelSprites = players.map(({ name, position: { x, y }, timeInState }) => {
    const itemX = x * tileWidth
    const itemY = y * tileWidth

    const label = timeInState > 0 ? `${name}\n(${timeInState})` : name

    return <Label
      key={`player-${name}-label`}
      text={label}
      halfTileWidth={halfTileWidth}
      itemX={itemX}
      itemY={itemY}
      filters={playerLabelFilters}
      zIndex={zIndex.playerLabel}
    />
  })

  const shootingAnimations = shootingLines
    .filter(({ age }) => age < 2)
    .map(({ fromPosition, toPosition }) => {
      const from = toPixels(fromPosition, tileWidth, halfTileWidth)
      const to = toPixels(toPosition, tileWidth, halfTileWidth)
      const rotation = rotateSpriteToTarget(from, to)

      return <Spring
        key={`projectile-${from.x}-${from.y}-to-${to.x}-${to.y}`}
        from={from}
        to={to}
        config={{ clamp: true }}
      >
        {(props: any) => <AnimatedSprite
          texture={textures.energyBall}
          anchor={[0.5, 0.5]}
          width={tileWidth}
          height={tileWidth}
          rotation={rotation}
          zIndex={zIndex.projectile}
          {...props}
        />}
      </Spring>
    })

  return (
    <div>
      <Stage
        className="mx-auto"
        width={stageWidth}
        height={stageHeight}
        options={{ antialias: false, backgroundColor: 0xeef1f5 }}
      >
        <TilingSprite
          key="map-floor"
          texture={textures.floor}
          width={stageWidth}
          height={stageHeight}
          tileScale={[floorTileScale, floorTileScale]}
          tilePosition={{ x: 0, y: 0 }}
        />
        {showMapGrid && <Graphics key="map-grid" draw={drawGrid} />}
        <Container key="map-static" position={[0, 0]}>
          {mapStaticSprites}
        </Container>
        <Container key="map-items-and-players" position={[0, 0]} sortableChildren={true}>
          {mapItemSprites}
          {playerSprites}
          {shootingAnimations}
          {mapItemLabelSprites}
          {playerLabelSprites}
        </Container>
      </Stage>
    </div>
  )
}
