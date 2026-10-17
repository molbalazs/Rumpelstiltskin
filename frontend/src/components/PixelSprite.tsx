import type { CSSProperties, ReactNode } from 'react'

export type Palette = Record<string, string>

interface PixelSpriteProps {
  /** One string per row, one character per pixel. `.` is transparent. */
  grid: readonly string[]
  palette: Palette
  className?: string
  title?: string
  /** Extra SVG drawn on top, in the same pixel coordinate space. */
  children?: ReactNode
}

/**
 * Renders a character grid as crisp SVG pixels. Horizontal runs of the same
 * colour are merged into a single rect, and each rect gets a `px-<char>` class
 * so individual colours can be animated from CSS.
 */
export function PixelSprite({ grid, palette, className, title, children }: PixelSpriteProps) {
  const cols = grid[0].length
  const rows = grid.length
  const rects: ReactNode[] = []

  grid.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      let end = x + 1
      while (end < row.length && row[end] === ch) end++
      if (ch !== '.') {
        rects.push(
          <rect
            key={`${x}-${y}`}
            className={`px-${ch}`}
            x={x}
            y={y}
            width={end - x}
            height={1}
            fill={palette[ch]}
          />,
        )
      }
      x = end
    }
  })

  return (
    <svg
      className={`sprite ${className ?? ''}`}
      style={{ '--cols': cols, '--rows': rows } as CSSProperties}
      viewBox={`0 0 ${cols} ${rows}`}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {rects}
      {children}
    </svg>
  )
}
