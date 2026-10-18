interface KeeperProps {
  talking: boolean
}

// The keeper is drawn upright, then the whole figure is leaned back 12° about
// the point between its feet, so its shoulder and head rest on the vault door.
// The boots stay flat on the floor (y = 446). Coordinates are scene units.

const PIVOT = '560 446'

/** A thin metal limb: ink outline, metal core, ribbed with dashes. */
function Tube({ d, w = 10 }: { d: string; w?: number }) {
  return (
    <g>
      <path d={d} className="tube-out" style={{ strokeWidth: w + 5 }} />
      <path d={d} className="tube-in" style={{ strokeWidth: w }} />
      <path d={d} className="ribs" style={{ strokeWidth: w - 1 }} />
    </g>
  )
}

function Joint({ x, y, r = 7 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle className="metal" cx={x} cy={y} r={r} strokeWidth={2.2} />
      <path className="hl" d={`M ${x - r * 0.55} ${y - r * 0.1} Q ${x - r * 0.45} ${y - r * 0.6} ${x} ${y - r * 0.65}`} strokeWidth={1.6} />
    </g>
  )
}

/**
 * The keeper: a tall, boxy, thoroughly tired robot with an old CRT for a head,
 * slumped against the vault door it guards. Idle it sighs, blinks slowly and
 * its gauge twitches; while talking it nods, mumbles and a little rain cloud
 * follows it around.
 */
export function Keeper({ talking }: KeeperProps) {
  return (
    <g className={`keeper${talking ? ' is-talking' : ''}`}>
      {/* Shadow on the floor */}
      <ellipse className="wash" cx={590} cy={449} rx={78} ry={9} />

      <g transform={`rotate(-12 ${PIVOT})`}>
        {/* Legs */}
        <Tube d="M 545 372 L 541 405 L 542 440" />
        <Tube d="M 575 372 L 578 405 L 578 440" />
        <Joint x={541} y={405} />
        <Joint x={578} y={405} />

        {/* Hips */}
        <rect className="metal-d" x={532} y={358} width={56} height={22} rx={7} strokeWidth={2.5} />

        <g className="keeper-upper">
          {/* Torso */}
          <rect className="metal" x={514} y={250} width={92} height={112} rx={13} strokeWidth={3} />
          <g clipPath="url(#torso-clip)">
            <rect className="wash" x={578} y={240} width={40} height={130} />
            <rect className="hatched" x={592} y={240} width={20} height={130} />
          </g>
          <path className="hl" d="M 522 270 Q 523 258 534 256" strokeWidth={3} />
          {[[524, 260], [596, 260], [524, 352], [596, 352]].map(([x, y]) => (
            <circle key={`${x}-${y}`} className="ink-fill" cx={x} cy={y} r={2.2} />
          ))}

          {/* Pressure gauge */}
          <circle className="screen" cx={560} cy={293} r={21} strokeWidth={2.5} />
          {[200, 225, 250, 270, 290, 315, 340].map((deg) => {
            const a = (deg * Math.PI) / 180
            return (
              <line
                key={deg}
                x1={560 + 14 * Math.cos(a)}
                y1={293 + 14 * Math.sin(a)}
                x2={560 + 18 * Math.cos(a)}
                y2={293 + 18 * Math.sin(a)}
                strokeWidth={1.5}
              />
            )
          })}
          <line className="needle" x1={560} y1={293} x2={549} y2={282} strokeWidth={2.2} />
          <circle className="ink-fill" cx={560} cy={293} r={3} />

          {/* Little access panel */}
          <rect className="metal-d" x={538} y={325} width={44} height={18} rx={3} strokeWidth={2} />
          <line x1={545} y1={331} x2={575} y2={331} strokeWidth={1.4} />
          <line x1={545} y1={337} x2={568} y2={337} strokeWidth={1.4} />

          {/* Long arms, hanging limp */}
          <Tube d="M 511 268 L 502 330 L 505 390" w={9} />
          <Tube d="M 609 268 L 618 330 L 615 390" w={9} />
          <Joint x={502} y={330} r={6} />
          <Joint x={618} y={330} r={6} />
          <path className="metal" d="M 497 392 L 513 392 Q 517 408 511 418 Q 504 422 498 416 Q 493 405 497 392 Z" strokeWidth={2.2} />
          <path d="M 505 404 L 505 417" strokeWidth={1.6} />
          <path className="metal" d="M 607 392 L 623 392 Q 626 405 621 416 Q 614 421 608 416 Q 604 405 607 392 Z" strokeWidth={2.2} />
          <path d="M 615 404 L 615 417" strokeWidth={1.6} />
          <Joint x={511} y={266} r={10} />
          <Joint x={609} y={266} r={10} />

          {/* Neck */}
          <rect className="metal-d" x={546} y={233} width={28} height={19} rx={3} strokeWidth={2.2} />
          <line x1={548} y1={239} x2={572} y2={239} strokeWidth={1.4} />
          <line x1={548} y1={245} x2={572} y2={245} strokeWidth={1.4} />

          <g className="keeper-head">
            {/* Antenna */}
            <path d="M 562 118 Q 563 104 568 92" strokeWidth={2.5} />
            <circle className="antenna-glow" cx={569} cy={86} r={12} />
            <circle className="metal" cx={569} cy={86} r={6.5} strokeWidth={2.2} />

            {/* Boxy CRT head: back shell for depth, then the front */}
            <rect className="metal-d" x={512} y={118} width={134} height={108} rx={20} strokeWidth={3} />
            {[150, 162, 174, 186, 198].map((y) => (
              <line key={y} x1={630} y1={y} x2={640} y2={y - 3} strokeWidth={2} />
            ))}
            <rect className="metal" x={494} y={128} width={132} height={108} rx={20} strokeWidth={3} />
            <path className="hl" d="M 503 170 Q 502 140 530 136" strokeWidth={3.5} />
            <path className="hl" d="M 540 134 L 556 134" strokeWidth={3} />

            {/* Screen */}
            <rect className="screen" x={510} y={144} width={94} height={77} rx={14} strokeWidth={3} />
            <path className="wash-stroke" d="M 516 212 Q 515 152 532 149" strokeWidth={4} />
            <path className="hl" d="M 588 150 Q 597 152 598 162" strokeWidth={2.5} />

            {/* Face: sad brows, heavy-lidded eyes, tired bags */}
            <path d="M 528 167 Q 537 164 546 160" strokeWidth={2.4} />
            <path d="M 568 160 Q 577 164 586 167" strokeWidth={2.4} />
            <g className="eyes">
              <ellipse className="ink-fill" cx={538} cy={182} rx={7} ry={9} />
              <ellipse className="ink-fill" cx={576} cy={182} rx={7} ry={9} />
              <path className="screen-fill" d="M 528 170 L 549 170 L 549 177 Q 539 175 528 180 Z" />
              <path className="screen-fill" d="M 565 170 L 586 170 L 586 180 Q 575 175 565 177 Z" />
              <path d="M 528 180 Q 539 175 549 177" strokeWidth={2.4} />
              <path d="M 565 177 Q 575 175 586 180" strokeWidth={2.4} />
              <circle className="hl-fill" cx={535} cy={184} r={2} />
              <circle className="hl-fill" cx={573} cy={184} r={2} />
            </g>
            <path className="soft" d="M 531 196 Q 538 199 545 196" strokeWidth={1.8} />
            <path className="soft" d="M 569 196 Q 576 199 583 196" strokeWidth={1.8} />

            <path className="mouth mouth-idle" d="M 548 207 Q 557 202 566 207" strokeWidth={2.4} />
            <ellipse className="mouth mouth-a ink-fill" cx={557} cy={206} rx={6} ry={4.5} />
            <ellipse className="mouth mouth-b ink-fill" cx={557} cy={206} rx={4} ry={2.2} />
          </g>
        </g>
      </g>

      {/* Boots, flat on the floor */}
      <path className="metal" d="M 520 446 L 521 437 Q 523 426 539 426 Q 557 426 561 437 L 563 446 Z" strokeWidth={2.6} />
      <path className="metal" d="M 560 446 L 561 432 Q 564 420 581 420 Q 601 421 604 434 L 606 446 Z" strokeWidth={2.6} />
      <line x1={521} y1={440} x2={562} y2={440} strokeWidth={1.8} />
      <line x1={561} y1={440} x2={605} y2={440} strokeWidth={1.8} />
      <path className="hl" d="M 527 434 Q 529 429 537 429" strokeWidth={2.2} />
      <path className="hl" d="M 567 428 Q 570 423 579 423" strokeWidth={2.2} />

      {/* A small personal rain cloud, out while it talks */}
      <g className="cloud">
        <path
          className="cloud-body"
          d="M 470 58 Q 466 40 484 38 Q 490 22 510 28 Q 524 16 538 30 Q 556 30 554 48 Q 560 62 544 64 L 478 64 Q 466 64 470 58 Z"
          strokeWidth={2.4}
        />
        <path className="wash" d="M 474 60 Q 500 52 552 56 Q 552 63 544 64 L 478 64 Q 470 64 474 60 Z" />
        <g className="rain">
          <line x1={485} y1={72} x2={481} y2={86} strokeWidth={2} />
          <line x1={505} y1={72} x2={501} y2={86} strokeWidth={2} />
          <line x1={525} y1={72} x2={521} y2={86} strokeWidth={2} />
          <line x1={545} y1={72} x2={541} y2={86} strokeWidth={2} />
        </g>
      </g>
    </g>
  )
}

/** Clip paths the keeper needs; rendered once inside the scene's <defs>. */
export function KeeperDefs() {
  return (
    <clipPath id="torso-clip">
      <rect x={514} y={250} width={92} height={112} rx={13} />
    </clipPath>
  )
}
