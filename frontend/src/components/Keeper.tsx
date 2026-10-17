import { PixelSprite } from './PixelSprite'

// K outline, L/M/D light/mid/dark steel, S face screen, A antenna light,
// Y bolts, R/O/G chest lights.
const KEEPER_GRID = [
  '........KKKK........',
  '........KAAK........',
  '........KAAK........',
  '........KKKK........',
  '.........DD.........',
  '...KKKKKKKKKKKKKK...',
  '..KLLLLLLLLLLLLLLK..',
  '..KLMMMMMMMMMMMMDK..',
  '..KLMKKKKKKKKKKMDK..',
  'KDKLMKSSSSSSSSKMDKDK',
  'KDKLMKSSSSSSSSKMDKDK',
  'KDKLMKSSSSSSSSKMDKDK',
  'KDKLMKSSSSSSSSKMDKDK',
  '..KLMKSSSSSSSSKMDK..',
  '..KLMKSSSSSSSSKMDK..',
  '..KLMKKKKKKKKKKMDK..',
  '..KLMMMMYMMYMMMMDK..',
  '..KDDDDDDDDDDDDDDK..',
  '...KKKKKKKKKKKKKK...',
  '......KDDDDDDK......',
  '...KKKKKKKKKKKKKK...',
  'KKKLLLLLLLLLLLLLLKKK',
  'KDKLMMMMMMMMMMMMDKDK',
  'KDKLMMKKKKKKKKMMDKDK',
  'KDKLMMKRROOGGKMMDKDK',
  'KDKLMMKKKKKKKKMMDKDK',
  'KKKLMMMMMMMMMMMMDKKK',
  '..KDDDDDDDDDDDDDDK..',
  '..KKKKKKKKKKKKKKKK..',
  '...KDDK......KDDK...',
  '...KKKK......KKKK...',
]

const KEEPER_PALETTE = {
  K: '#181425',
  L: '#dfe6f2',
  M: '#9fb0c7',
  D: '#5c6b8a',
  S: '#0e2f2a',
  A: '#e43b44',
  Y: '#feae34',
  R: '#e43b44',
  O: '#feae34',
  G: '#63c74d',
}

interface KeeperProps {
  talking: boolean
}

export function Keeper({ talking }: KeeperProps) {
  return (
    <div className={`keeper${talking ? ' is-talking' : ''}`}>
      <PixelSprite
        grid={KEEPER_GRID}
        palette={KEEPER_PALETTE}
        className="keeper-sprite"
        title="The keeper: a boxy robot with a glowing face screen"
      >
        <g className="keeper-face" fill="#63f28c">
          <rect x={6} y={9} width={1} height={1} fill="#2a5c50" />
          <rect className="keeper-eye" x={7} y={10} width={1} height={2} />
          <rect className="keeper-eye" x={12} y={10} width={1} height={2} />
          <rect className="mouth mouth-idle" x={9} y={13} width={2} height={1} />
          <rect className="mouth mouth-a" x={8} y={13} width={4} height={1} />
          <rect className="mouth mouth-b" x={9} y={13} width={2} height={2} />
        </g>
      </PixelSprite>
    </div>
  )
}
