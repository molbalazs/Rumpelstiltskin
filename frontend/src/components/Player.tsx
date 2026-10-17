import { PixelSprite } from './PixelSprite'

// Back view of the player, cropped at the waist like a Game Boy battle scene.
// K outline, R cap, W cap logo, H hair, S skin, B shirt, D shirt shadow.
const PLAYER_GRID = [
  '.....KKKKKK.....',
  '....KRRRRRRK....',
  '...KRRRRRRRRK...',
  '..KRRRRWWRRRRK..',
  '..KRRRRRRRRRRK..',
  '.KKKKKKKKKKKKKK.',
  '..KHHHHHHHHHHK..',
  '..KHHHHHHHHHHK..',
  '..KSHHHHHHHHSK..',
  '...KKSSSSSSKK...',
  '.KKBBBKSSKBBBKK.',
  'KBBBBBBBBBBBBBBK',
  'KBBBBBBBBBBBBBBK',
  'KBBBDBBBBBBDBBBK',
  'KBBBDBBBBBBDBBBK',
]

const PLAYER_PALETTE = {
  K: '#181425',
  R: '#e43b44',
  W: '#ffffff',
  H: '#733e39',
  S: '#e4a672',
  B: '#3b5dc9',
  D: '#29366f',
}

export function Player() {
  return (
    <PixelSprite
      grid={PLAYER_GRID}
      palette={PLAYER_PALETTE}
      className="player-sprite"
      title="You, seen from behind"
    />
  )
}
