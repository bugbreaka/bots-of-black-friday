import React from 'react'
import { Container, NineSlicePlane, Sprite, Text } from '@pixi/react'
import { AlphaFilter, type Filter, TextMetrics, TextStyle, type Texture } from 'pixi.js'
import { Spring } from '@react-spring/web'
import { Sprite as AnimatedSprite } from '@pixi/react-animated'
import { isNull } from 'lodash'
import { type GameState } from '@src/types/GameState'
import { type Item } from '@src/types/Item'
import { pickByString } from '@src/utils/pickByString'
import { type MapDimensions } from '@src/utils/MapDimensions'
import { getJunkTexture, getPlayerTexture, textures } from '@src/utils/textures'
import { type PixelPosition, toPixelPosition } from '@src/utils/toPixelPosition'

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
  itemPosition: PixelPosition
  texture: Texture
  labelText: string | null
  key: string
}

type MapItemWithLabel = MapItem & { labelText: string }

function getWeaponTexture (x: number, y: number): Texture {
  const sum = Math.abs(x + y)
  return sum % 2 === 0 ? textures.weaponWand : textures.weaponAxe
}

function Label ({
  text,
  halfTileWidth,
  itemPosition,
  zIndex,
  filters
}: {
  text: string
  halfTileWidth: number
  itemPosition: PixelPosition
  zIndex: number
  filters: Filter[]
}): JSX.Element {
  const labelMetrics = TextMetrics.measureText(text, labelTextStyle)

  const labelPadding = 8

  const labelWidth = labelMetrics.maxLineWidth + labelPadding + labelPadding
  const labelHeight = labelMetrics.height + labelPadding + labelPadding
  const labelX = itemPosition.xInPx - Math.round(labelWidth * 0.5)
  const labelY = itemPosition.yInPx - labelHeight - Math.round(halfTileWidth * 1.3)

  const labelContentX = labelPadding
  const labelContentY = labelPadding

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

/**
 * Sprite must be oriented originally upwards.
 *
 * @param originX
 * @param originY
 * @param targetX
 * @param targetY
 */
function rotateSpriteToTarget (
  { xInPx: originX, yInPx: originY }: PixelPosition,
  { xInPx: targetX, yInPx: targetY }: PixelPosition
): number {
  const shiftedOriginX = 0
  const shiftedOriginY = -15
  const shiftedTargetX = targetX - originX
  const shiftedTargetY = targetY - originY

  const angle = Math.atan2(
    (shiftedTargetY * shiftedOriginX) - (shiftedTargetX * shiftedOriginY),
    (shiftedTargetX * shiftedOriginX) + (shiftedTargetY * shiftedOriginY)
  )
  return angle
}

export function MapDynamicContent ({
  gameState: {
    items,
    players,
    shootingLines
  },
  dimensions: {
    tileWidth,
    halfTileWidth
  },
  showBeer,
  showItemLabels
}: {
  gameState: GameState
  dimensions: MapDimensions
  showBeer: boolean
  showItemLabels: boolean
}): JSX.Element {
  const mapItems = items.map((item): MapItem | null => {
    const {
      type,
      position
    } = item

    let texture: Texture
    if (type === 'JUST_SOME_JUNK') {
      texture = getJunkTexture(position.x, position.y)
    } else if (type === 'WEAPON') {
      texture = getWeaponTexture(position.x, position.y)
    } else if (type === 'POTION') {
      texture = showBeer ? textures.beer : textures.potion
    } else {
      return null
    }

    const itemPosition = toPixelPosition(position, tileWidth, halfTileWidth)

    return {
      ...item,
      texture,
      labelText: getItemLabelText(item),
      itemPosition,
      key: `${type}-${position.y}-${position.x}`
    }
  }).filter((item): item is MapItem => !isNull(item))

  const mapItemSprites = mapItems.map(({
    key,
    itemPosition,
    texture
  }) => {
    return <Sprite
      key={`${key}-sprite`}
      anchor={[0.5, 0.5]}
      x={itemPosition.xInPx}
      y={itemPosition.yInPx}
      width={tileWidth}
      height={tileWidth}
      texture={texture}
      zIndex={zIndex.item}
    />
  })

  const mapItemLabelSprites = mapItems
    .filter(() => showItemLabels)
    .filter((item): item is MapItemWithLabel => !isNull(item.labelText))
    .map(({
      key,
      itemPosition,
      labelText
    }) => {
      return <Label
        key={`${key}-label`}
        text={labelText}
        halfTileWidth={halfTileWidth}
        itemPosition={itemPosition}
        filters={itemLabelFilters}
        zIndex={zIndex.itemLabel}
      />
    })

  const playerSprites = players.map(({ name, position }) => {
    const playerPosition = toPixelPosition(position, tileWidth, halfTileWidth)

    return <Sprite
      key={`player-${name}-sprite`}
      anchor={[0.5, 0.5]}
      x={playerPosition.xInPx}
      y={playerPosition.yInPx}
      width={tileWidth}
      height={tileWidth}
      texture={getPlayerTexture(name)}
      tint={getPlayerTint(name)}
      zIndex={zIndex.player}
    />
  })

  const playerLabelSprites = players.map(({ name, position, timeInState }) => {
    const playerPosition = toPixelPosition(position, tileWidth, halfTileWidth)

    const label = timeInState > 0 ? `${name}\n(${timeInState})` : name

    return <Label
      key={`player-${name}-label`}
      text={label}
      halfTileWidth={halfTileWidth}
      itemPosition={playerPosition}
      filters={playerLabelFilters}
      zIndex={zIndex.playerLabel}
    />
  })

  const shootingAnimations = shootingLines
    .filter(({ age }) => age < 2)
    .map(({ fromPosition, toPosition }) => {
      const from = toPixelPosition(fromPosition, tileWidth, halfTileWidth)
      const to = toPixelPosition(toPosition, tileWidth, halfTileWidth)
      const rotation = rotateSpriteToTarget(from, to)

      return <Spring
        key={`projectile-${fromPosition.x}-${fromPosition.y}-to-${toPosition.x}-${toPosition.y}`}
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
    <Container key="map-items-and-players" position={[0, 0]} sortableChildren={true}>
      {mapItemSprites}
      {playerSprites}
      {shootingAnimations}
      {mapItemLabelSprites}
      {playerLabelSprites}
    </Container>
  )
}
