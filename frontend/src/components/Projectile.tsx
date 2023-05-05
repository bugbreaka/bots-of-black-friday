import React, { useState } from 'react'
import { useSpring } from '@react-spring/web'
import { Sprite as AnimatedSprite } from '@pixi/react-animated'
import { textures } from '@src/utils/textures'
import { type PixelPosition, toPixelPosition } from '@src/utils/toPixelPosition'
import { type Position } from '@src/types/Position'
import { zIndex } from '@src/utils/zIndex'

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

interface ProjectileProperties {
  fromPosition: Position
  toPosition: Position
  tileWidth: number
  halfTileWidth: number
}

export const Projectile: React.FunctionComponent<ProjectileProperties> = function ({
  fromPosition,
  toPosition,
  tileWidth,
  halfTileWidth
}) {
  const from = toPixelPosition(fromPosition, tileWidth, halfTileWidth)
  const to = toPixelPosition(toPosition, tileWidth, halfTileWidth)
  const [rotation] = useState(rotateSpriteToTarget(from, to))

  const props = useSpring({
    from: { x: from.xInPx, y: from.yInPx },
    to: { x: to.xInPx, y: to.yInPx },
    config: {
      clamp: true
    }
  })

  return (<AnimatedSprite
    texture={textures.energyBall}
    anchor={[0.5, 0.5]}
    width={tileWidth}
    height={tileWidth}
    rotation={rotation}
    zIndex={zIndex.projectile}
    {...props}
  />)
}
