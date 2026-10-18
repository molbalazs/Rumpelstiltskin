// The round vault door, drawn like an ink sketch with grey washes.
// Scene coordinates: 800 × 520, floor at y = 446.

export const CX = 330
export const CY = 262
const FRAME_R = 180
const DOOR_R = 158

const polar = (r: number, deg: number, cx = CX, cy = CY) => {
  const a = (deg * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const
}

/** SVG arc path along a circle around the door centre, from one angle to another. */
const arc = (r: number, from: number, to: number) => {
  const [x0, y0] = polar(r, from)
  const [x1, y1] = polar(r, to)
  return `M ${x0} ${y0} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1} ${y1}`
}

const SPOKES = [0, 60, 120, 180, 240, 300]

export function Vault() {
  return (
    <g className="vault">
      {/* Heavy frame set into the wall, shaded and hatched toward the bottom right */}
      <circle className="metal-d" cx={CX} cy={CY} r={FRAME_R} strokeWidth={3} />
      <g clipPath="url(#frame-clip)">
        <path className="hatched" d={`M ${CX - 260} ${CY + 120} L ${CX + 120} ${CY - 260} L ${CX + 260} ${CY + 260} L ${CX - 260} ${CY + 260} Z`} />
      </g>
      {Array.from({ length: 24 }, (_, i) => {
        const [x, y] = polar(171, i * 15 + 7.5)
        return <circle key={i} className="metal" cx={x} cy={y} r={3} strokeWidth={1.5} />
      })}
      <path className="hl" d={arc(174, 195, 255)} strokeWidth={3} />

      {/* Wheel's drop shadow is part of the door face, so draw the face first */}
      <circle className="metal-d" cx={CX} cy={CY} r={DOOR_R} strokeWidth={3} />
      <g clipPath="url(#door-clip)">
        <circle className="metal" cx={CX - 16} cy={CY - 16} r={DOOR_R - 6} style={{ stroke: 'none' }} />
      </g>
      <circle cx={CX} cy={CY} r={DOOR_R} strokeWidth={3} />
      <path className="hl" d={arc(146, 200, 250)} strokeWidth={4} />

      {/* Machined groove */}
      <circle cx={CX} cy={CY} r={122} strokeWidth={2} />
      <path className="hl" d={arc(118.5, 190, 270)} strokeWidth={1.8} />

      {/* Locking bolts */}
      {Array.from({ length: 12 }, (_, i) => {
        const [x, y] = polar(140, i * 30 + 15)
        return (
          <g key={i}>
            <circle className="metal" cx={x} cy={y} r={6.5} strokeWidth={2} />
            <circle className="ink-fill" cx={x + 1.5} cy={y + 1.5} r={2} />
          </g>
        )
      })}

      {/* Combination dial */}
      <circle className="metal" cx={CX} cy={CY - 97} r={19} strokeWidth={2.5} />
      {Array.from({ length: 12 }, (_, i) => {
        const [x0, y0] = polar(15, i * 30, CX, CY - 97)
        const [x1, y1] = polar(19, i * 30, CX, CY - 97)
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} strokeWidth={1.4} />
      })}
      <circle className="metal-d" cx={CX} cy={CY - 97} r={8} strokeWidth={2} />
      <path className="hl" d={`M ${CX - 12} ${CY - 104} Q ${CX - 9} ${CY - 111} ${CX - 2} ${CY - 113}`} strokeWidth={2} />

      {/* Handle wheel: soft shadow, rim, spokes with knobs, hub */}
      <circle className="wash-stroke" cx={CX + 9} cy={CY + 11} r={60} strokeWidth={14} />
      {SPOKES.map((deg) => {
        const [x0, y0] = polar(18, deg)
        const [x1, y1] = polar(74, deg)
        return (
          <g key={deg}>
            <line className="tube-out" x1={x0} y1={y0} x2={x1} y2={y1} />
            <line className="tube-in" x1={x0} y1={y0} x2={x1} y2={y1} />
          </g>
        )
      })}
      <circle className="tube-out" cx={CX} cy={CY} r={58} />
      <circle className="tube-in" cx={CX} cy={CY} r={58} />
      <path className="hl" d={arc(58, 195, 260)} strokeWidth={2} />
      {SPOKES.map((deg) => {
        const [x, y] = polar(76, deg)
        return (
          <g key={deg}>
            <circle className="metal" cx={x} cy={y} r={9} strokeWidth={2.5} />
            <path className="hl" d={`M ${x - 5} ${y - 1} Q ${x - 4} ${y - 5} ${x} ${y - 6}`} strokeWidth={1.8} />
          </g>
        )
      })}
      <circle className="metal" cx={CX} cy={CY} r={19} strokeWidth={2.5} />
      <circle className="metal-d" cx={CX} cy={CY} r={8} strokeWidth={2} />
      <path className="hl" d={`M ${CX - 12} ${CY - 6} Q ${CX - 10} ${CY - 13} ${CX - 3} ${CY - 15}`} strokeWidth={2} />

      {/* Hinges on the left */}
      {[CY - 82, CY + 38].map((y) => (
        <g key={y}>
          <rect className="metal" x={CX - 194} y={y} width={36} height={44} rx={7} strokeWidth={2.5} />
          <rect className="wash" x={CX - 172} y={y + 3} width={12} height={38} rx={4} />
          <line x1={CX - 194} y1={y + 22} x2={CX - 158} y2={y + 22} strokeWidth={2} />
          <line className="hl" x1={CX - 189} y1={y + 6} x2={CX - 189} y2={y + 17} strokeWidth={2} />
        </g>
      ))}
    </g>
  )
}

/** Clip paths the vault needs; rendered once inside the scene's <defs>. */
export function VaultDefs() {
  return (
    <>
      <clipPath id="frame-clip">
        <circle cx={CX} cy={CY} r={FRAME_R} />
      </clipPath>
      <clipPath id="door-clip">
        <circle cx={CX} cy={CY} r={DOOR_R} />
      </clipPath>
    </>
  )
}
