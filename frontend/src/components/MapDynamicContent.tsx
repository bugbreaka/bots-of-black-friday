import React from 'react'
import { Container } from '@pixi/react'
import { isNull } from 'lodash'
import { type GameState } from '@src/types/GameState'
import { type Item } from '@src/types/Item'
import { type MapDimensions } from '@src/utils/MapDimensions'
import { getPlayerTexture } from '@src/utils/textures'
import { toPixelPosition } from '@src/utils/toPixelPosition'
import { zIndex } from '@src/utils/zIndex'
import { Projectile } from '@src/components/Projectile'
import { MapItem } from '@src/components/MapItem'
import { getPlayerTint, MapPlayer } from '@src/components/MapPlayer'
import { Label } from '@src/components/Label'
import { labelFilters } from '@src/utils/labelFilters'

/*
TODO
  - yksikkötestit canvaksille
  - depsujen päivitys
*/

function getItemLabelText ({ type, price, discountPercent }: Item): string | null {
  if (type === 'JUST_SOME_JUNK') {
    return discountPercent > 0 ? `${price} €\n-${discountPercent} %` : `${price} €`
  }

  if (type === 'WEAPON') {
    return `${price} €`
  }

  return null
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
  const itemSprites = items.map((item) => {
    return <MapItem
      key={`item-${item.type}-${item.position.x}-${item.position.y}`}
      item={item}
      tileWidth={tileWidth}
      halfTileWidth={halfTileWidth}
      showBeer={showBeer}
    />
  })

  const itemLabelSprites = (showItemLabels ? items : [])
    .map((item) => ([item, getItemLabelText(item)]))
    .filter((pair): pair is [Item, string] => !isNull(pair[1]))
    .map(([item, labelText]) => {
      const itemPosition = toPixelPosition(item.position, tileWidth, halfTileWidth)

      return <Label
        key={`item-${item.type}-${item.position.x}-${item.position.y}-label`}
        text={labelText}
        halfTileWidth={halfTileWidth}
        itemPosition={itemPosition}
        filters={labelFilters.item}
        zIndex={zIndex.itemLabel}
      />
    })

  const playerSprites = players.map((player) => {
    return <MapPlayer
      key={`player-${player.name}`}
      player={player}
      tileWidth={tileWidth}
      halfTileWidth={halfTileWidth}
      texture={getPlayerTexture(player.name)}
      tint={getPlayerTint(player.name)}
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
      filters={labelFilters.player}
      zIndex={zIndex.playerLabel}
    />
  })

  const projectiles = shootingLines
    .filter(({ age }) => age < 2)
    .map(({ fromPosition, toPosition }) => {
      return <Projectile
        key={`projectile-${fromPosition.x}-${fromPosition.y}-to-${toPosition.x}-${toPosition.y}`}
        fromPosition={fromPosition}
        toPosition={toPosition}
        tileWidth={tileWidth}
        halfTileWidth={halfTileWidth}
      />
    })

  return (
    <Container position={[0, 0]} sortableChildren={true}>
      {itemSprites}
      {playerSprites}
      {projectiles}
      {itemLabelSprites}
      {playerLabelSprites}
    </Container>
  )
}
