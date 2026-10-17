interface KeeperProps {
  talking: boolean
}

// The sprite is drawn on an 88 × 100 pixel canvas. Shapes are painted into
// a grid at module load (1-pixel outlines, dithered shading), then each row
// is merged into runs and rendered as crisp SVG rects. Tones map to CSS
// classes (.k ink, .p paper, .g grey) so the sprite follows the theme.

type Tone = 'k' | 'p' | 'g'
type Plot = (x: number, y: number, tone: Tone) => void
interface Run {
  x: number
  y: number
  w: number
  tone: Tone
}

const W = 88
const H = 100

function paint(draw: (set: Plot) => void): Run[] {
  const cells: (Tone | null)[] = new Array(W * H).fill(null)
  draw((x, y, tone) => {
    if (x >= 0 && x < W && y >= 0 && y < H) cells[y * W + x] = tone
  })
  const runs: Run[] = []
  for (let y = 0; y < H; y++) {
    let x = 0
    while (x < W) {
      const tone = cells[y * W + x]
      let end = x + 1
      while (end < W && cells[y * W + end] === tone) end++
      if (tone) runs.push({ x, y, w: end - x, tone })
      x = end
    }
  }
  return runs
}

/** Ordered 1-bit dither: how much ink to show for shade 0 (none) to 1 (half). */
const dither = (x: number, y: number, shade: number) =>
  shade > 0.75
    ? (x + y) % 2 === 0
    : shade > 0.5
      ? x % 2 === 0 && y % 2 === 0
      : shade > 0.3
        ? x % 4 === 0 && y % 4 === (x % 8 === 0 ? 0 : 2)
        : false

type Inside = (x: number, y: number) => boolean

/** Paper fill with a 1-pixel ink outline and optional dithered shading. */
function shape(set: Plot, inside: Inside, box: [number, number, number, number], shade?: (x: number, y: number) => number) {
  const [x0, y0, x1, y1] = box
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!inside(x, y)) continue
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)
      set(x, y, edge || (shade && dither(x, y, shade(x, y))) ? 'k' : 'p')
    }
  }
}

const ellipse = (cx: number, cy: number, a: number, b: number): Inside => (x, y) =>
  ((x + 0.5 - cx) / a) ** 2 + ((y + 0.5 - cy) / b) ** 2 <= 1

/** Light from the top left: shade grows toward the right, keeping the face clear. */
const lit = (cx: number, cy: number, a: number, b: number) => (x: number, y: number) =>
  ((x + 0.5 - cx) / a) * 0.8 + ((y + 0.5 - cy) / b) * 0.45 - 0.1

// ---------- Static body ----------

const HEAD = { cx: 44, cy: 38, a: 31, b: 26 }
const EYES = [31, 57]

// Torso half-width: narrow, rounded shoulders that slump outward.
const torso = (y: number) => 13 + (y - 68) * 0.4 - (y < 72 ? (72 - y) * 1.2 : 0)

const BODY = paint((set) => {
  // Neck
  for (let y = 62; y <= 69; y++) {
    for (let x = 40; x <= 47; x++) set(x, y, x === 40 || x === 47 || y % 2 === 0 ? 'k' : 'p')
  }

  // Torso, then long arms hanging at its sides
  const inTorso: Inside = (x, y) => y >= 68 && y < H && Math.abs(x + 0.5 - 44) <= torso(y)
  shape(set, inTorso, [10, 68, 78, H - 1], (x, y) => ((x + 0.5 - 44) / torso(y)) * 0.7 + 0.15)
  const arm = (side: -1 | 1): Inside => (x, y) => {
    if (y < 71 || y >= H) return false
    const inner = 44 + side * (torso(y) + 2)
    const outer = inner + side * 4
    return side < 0 ? x >= outer && x <= inner : x >= inner && x <= outer
  }
  shape(set, arm(-1), [0, 71, 44, H - 1], () => 0.35)
  shape(set, arm(1), [44, 71, W - 1, H - 1], () => 0.8)

  // Padlock on the chest: it is guarding a secret, after all
  for (let x = 40; x <= 48; x++) set(x, 75, 'k')
  for (let y = 76; y <= 79; y++) {
    set(39, y, 'k')
    set(49, y, 'k')
  }
  shape(set, (x, y) => x >= 37 && x <= 51 && y >= 80 && y <= 90, [37, 80, 51, 90], (x) => (x >= 49 ? 0.8 : 0))
  for (const [x, y] of [[43, 83], [44, 83], [45, 83], [43, 84], [44, 84], [45, 84], [44, 85], [44, 86], [44, 87]]) set(x, y, 'k')

  // Ears, behind the head
  shape(set, ellipse(13, 40, 4, 7), [8, 32, 18, 48], () => 0.6)
  shape(set, ellipse(75, 40, 4, 7), [70, 32, 80, 48], () => 0.8)

  // The big round head
  const { cx, cy, a, b } = HEAD
  shape(set, ellipse(cx, cy, a, b), [12, 11, 76, 65], lit(cx, cy, a, b))
  // Soft highlight on the dome
  for (let t = 35; t <= 80; t += 4) {
    const r = (t * Math.PI) / 180
    set(Math.round(cx - (a - 5) * Math.cos(r)), Math.round(cy - (b - 5) * Math.sin(r)), 'g')
  }

  // Sad brows: inner ends raised
  for (let x = 23; x <= 36; x++) set(x, Math.round(30 - (x - 23) * 0.28), 'k')
  for (let x = 52; x <= 65; x++) set(x, Math.round(26.4 + (x - 52) * 0.28), 'k')

  // Eye sockets
  for (const ex of EYES) {
    const socket = ellipse(ex, 39, 8, 7.5)
    for (let y = 31; y <= 47; y++) for (let x = ex - 9; x <= ex + 9; x++) if (socket(x, y)) set(x, y, 'k')
  }
})

// ---------- Animated parts ----------

// Eyes: big round lenses under heavy, drooping lids (outer corners lower).
const LENSES = paint((set) => {
  EYES.forEach((ex, i) => {
    const lid = (x: number) => 36.5 + (x + 0.5 - ex) * (i === 0 ? -0.3 : 0.3)
    const inside: Inside = (x, y) => ellipse(ex, 40, 5.6, 5.6)(x, y) && y + 0.5 >= lid(x + 0.5)
    for (let y = 33; y <= 47; y++) {
      for (let x = ex - 7; x <= ex + 7; x++) {
        if (!inside(x, y)) continue
        const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y + 1)
        set(x, y, edge ? 'g' : 'p')
      }
    }
  })
})

// Pupils rest low: it can't be bothered to look up.
const PUPILS = paint((set) => {
  for (const ex of EYES) {
    const pupil = ellipse(ex, 42.5, 2, 2)
    for (let y = 39; y <= 46; y++) for (let x = ex - 3; x <= ex + 3; x++) if (pupil(x, y)) set(x, y, 'k')
  }
})

const MOUTH_IDLE = paint((set) => {
  for (let x = 40; x <= 47; x++) set(x, 55, 'k')
  set(39, 56, 'k')
  set(48, 56, 'k')
})

const MOUTH_A = paint((set) => {
  for (let y = 54; y <= 56; y++) for (let x = 40; x <= 47; x++) set(x, y, y === 55 && x > 40 && x < 47 ? 'p' : 'k')
})

const MOUTH_B = paint((set) => {
  for (let y = 54; y <= 55; y++) for (let x = 41; x <= 46; x++) set(x, y, 'k')
})

// A small personal rain cloud, out while it talks.
const CLOUD = paint((set) => {
  const puffs = [ellipse(58, 6, 4, 4), ellipse(64, 5, 5, 5), ellipse(70, 7, 3.5, 3.5)]
  const inside: Inside = (x, y) => y <= 9 && puffs.some((p) => p(x, y))
  shape(set, inside, [53, 0, 75, 9], (_, y) => (y >= 7 ? 0.6 : 0))
})

const drops = (points: number[][]) =>
  paint((set) => {
    for (const [x, y] of points) {
      set(x, y, 'k')
      set(x, y + 1, 'k')
    }
  })
const RAIN_A = drops([[57, 11], [63, 13], [69, 11]])
const RAIN_B = drops([[60, 12], [66, 11], [72, 13]])

function Layer({ runs, className }: { runs: Run[]; className?: string }) {
  return (
    <g className={className}>
      {runs.map((r) => (
        <rect key={`${r.x}-${r.y}`} className={r.tone} x={r.x} y={r.y} width={r.w} height={1} />
      ))}
    </g>
  )
}

/**
 * The keeper: a big, round-headed, thoroughly fed-up robot guarding the
 * secret from behind a counter. Idle it slumps, blinks slowly and glances up;
 * while talking it mumbles and a little rain cloud follows it around.
 */
export function Keeper({ talking }: KeeperProps) {
  return (
    <div className={`keeper${talking ? ' is-talking' : ''}`}>
      <svg className="keeper-sprite" viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" role="img">
        <title>The keeper: a big, round-headed robot with sad, droopy eyes</title>
        <Layer runs={BODY} />
        <Layer runs={LENSES} className="lenses" />
        <Layer runs={PUPILS} className="pupils" />
        <Layer runs={MOUTH_IDLE} className="mouth mouth-idle" />
        <Layer runs={MOUTH_A} className="mouth mouth-a" />
        <Layer runs={MOUTH_B} className="mouth mouth-b" />
        <Layer runs={CLOUD} className="cloud" />
        <Layer runs={RAIN_A} className="rain rain-a" />
        <Layer runs={RAIN_B} className="rain rain-b" />
      </svg>
    </div>
  )
}
