import { PixelSprite } from './PixelSprite'

// Back view of the player, seen over the shoulder.
// K outline, R beanie, W beanie stripe, H hair, S skin, B shirt, D shirt shadow.
const PLAYER_GRID = [
  '.....KKKKKK.....',
  '....KRRRRRRK....',
  '...KRRRRRRRRK...',
  '..KWWWWWWWWWWK..',
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
  R: '#feae34',
  W: '#f77622',
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
