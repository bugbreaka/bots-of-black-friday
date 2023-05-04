import React from 'react'
import { Container, NineSlicePlane, Sprite, Text } from '@pixi/react'
import { AlphaFilter, type Filter, TextMetrics, TextStyle, type Texture } from 'pixi.js'
import { Spring } from '@react-spring/web'
import { Sprite as AnimatedSprite } from '@pixi/react-animated'
import { isNull } from 'lodash'
import { type GameState } from '@src/types/GameState'
import { type Item } from '@src/types/Item'
import { type Position } from '@src/types/Position'
import { pickByString } from '@src/utils/pickByString'
import { type MapDimensions } from '@src/utils/MapDimensions'
import { getJunkTexture, getPlayerTexture, textures } from '@src/utils/textures'

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
  itemX: number
  itemY: number
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
  }).filter((item): item is MapItem => !isNull(item))

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
    .filter((item): item is MapItemWithLabel => !isNull(item.labelText))
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
    <Container key="map-items-and-players" position={[0, 0]} sortableChildren={true}>
      {mapItemSprites}
      {playerSprites}
      {shootingAnimations}
      {mapItemLabelSprites}
      {playerLabelSprites}
    </Container>
  )
}
