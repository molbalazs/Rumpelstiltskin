import { Keeper, KeeperDefs } from './Keeper'
import { Vault, VaultDefs } from './Vault'

interface SceneProps {
  keeperTalking: boolean
}

// Three seeds for the wobble filter: cycling between them makes the ink
// lines "boil" gently, like hand-drawn animation.
const SEEDS = [2, 9, 17]

export function Scene({ keeperTalking }: SceneProps) {
  return (
    <section className="scene" aria-label="A tired robot leans against a huge round vault door">
      <svg className="scene-art" viewBox="0 0 800 520" role="img">
        <title>The keeper, a tall boxy robot with a tired face on its screen, slumped against a round vault door</title>
        <defs>
          {SEEDS.map((seed, i) => (
            <filter key={seed} id={`sketch-${i}`} x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={seed} result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={3.5} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          ))}
          <filter id="wash-edge" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={4} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={22} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <pattern id="hatch" width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
            <line className="hatch-line" x1={0} y1={0} x2={0} y2={7} />
          </pattern>
          <VaultDefs />
          <KeeperDefs />
        </defs>

        {/* Loose washes on the wall and floor, behind the linework */}
        <g className="washes" filter="url(#wash-edge)">
          <path className="wash" d="M -20 -20 L 520 -20 Q 470 40 330 60 Q 150 80 100 200 Q 70 300 -20 330 Z" />
          <path className="wash" d="M 640 -20 L 820 -20 L 820 260 Q 760 200 720 120 Q 690 40 640 -20 Z" />
          <path className="wash" d="M -20 446 L 820 446 L 820 540 L -20 540 Z" />
          <path className="wash" d="M 120 470 Q 200 456 300 466 Q 360 480 300 492 Q 200 500 140 488 Q 100 480 120 470 Z" />
          <path className="wash" d="M 620 478 Q 680 468 730 478 Q 750 490 700 494 Q 640 496 620 478 Z" />
        </g>

        <g className="art">
          {/* Wall and floor */}
          <path d="M 0 446 Q 200 444 400 447 T 800 445" strokeWidth={2.5} />
          <path className="soft" d="M 0 120 Q 60 119 140 121" strokeWidth={1.6} />
          <path className="soft" d="M 560 70 Q 680 68 800 71" strokeWidth={1.6} />
          <path className="soft" d="M 690 446 L 700 72" strokeWidth={1.4} />
          <path className="soft" d="M 40 480 L 110 478 M 360 500 L 470 497 M 640 506 L 760 503" strokeWidth={1.4} />
          <ellipse className="wash" cx={335} cy={448} rx={175} ry={9} />

          <Vault />

          {/* A note taped to the wall */}
          <g transform="translate(732 196) rotate(6)">
            <rect className="note" x={-50} y={-34} width={100} height={68} strokeWidth={1.6} />
            <rect className="tape" x={-18} y={-42} width={36} height={14} transform="rotate(-4)" />
            <text className="note-text" x={0} y={-4}>The answer</text>
            <text className="note-text" x={0} y={20}>is no.</text>
          </g>

          {/* A couple of loose nuts on the floor */}
          <g transform="translate(660 462) rotate(-15)">
            <rect className="metal" x={-7} y={-5} width={14} height={10} rx={2} strokeWidth={2} />
            <circle className="ink-fill" cx={0} cy={0} r={2} />
          </g>
          <g transform="translate(688 470) rotate(20)">
            <rect className="metal-d" x={-5} y={-4} width={10} height={8} rx={2} strokeWidth={1.8} />
          </g>

          <Keeper talking={keeperTalking} />
        </g>
      </svg>
    </section>
  )
}
