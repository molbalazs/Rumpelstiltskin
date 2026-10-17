import { PixelSprite } from './PixelSprite'

// Row widths of a stepped ellipse, 32 pixels wide.
const ROW_WIDTHS = [16, 24, 28, 30, 30, 28, 24, 16]
const COLS = 32

const inside = (x: number, y: number) => {
  const w = ROW_WIDTHS[y]
  if (w === undefined) return false
  const pad = (COLS - w) / 2
  return x >= pad && x < pad + w
}

// Outline any cell with an empty neighbour; light top half, darker bottom half.
const PLATFORM_GRID = ROW_WIDTHS.map((_, y) =>
  Array.from({ length: COLS }, (_, x) => {
    if (!inside(x, y)) return '.'
    const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)
    if (edge) return 'K'
    return y < ROW_WIDTHS.length / 2 ? 'L' : 'M'
  }).join(''),
)

const PLATFORM_PALETTE = {
  K: '#265c42',
  L: '#9be36b',
  M: '#63c74d',
}

export function Platform({ className }: { className?: string }) {
  return <PixelSprite grid={PLATFORM_GRID} palette={PLATFORM_PALETTE} className={`platform ${className ?? ''}`} />
}
