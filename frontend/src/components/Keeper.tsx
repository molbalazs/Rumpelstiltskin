import { useId } from 'react'

interface KeeperProps {
  talking: boolean
}

// Coordinates are in sprite pixels (72 × 76). Every shape sits on whole
// pixels and renders with crispEdges, so it scales up as hard-edged pixel art.
// Fills come from CSS classes (.k ink, .p paper, .g grey) so the sprite
// follows the light/dark theme.

/**
 * The keeper: a grumpy, boxy robot bust behind a counter, with a padlock on
 * its chest. While talking it grits its teeth, puffs steam and its screen
 * flickers.
 */
export function Keeper({ talking }: KeeperProps) {
  const id = useId()
  const d50 = `${id}-d50`
  const d25 = `${id}-d25`

  return (
    <div className={`keeper${talking ? ' is-talking' : ''}`}>
      <svg
        className="keeper-sprite"
        viewBox="0 0 72 76"
        shapeRendering="crispEdges"
        role="img"
      >
        <title>The keeper: a grumpy robot with a padlock on its chest</title>
        <defs>
          {/* 1-bit dither patterns: 50% checker and 25% dots */}
          <pattern id={d50} width={2} height={2} patternUnits="userSpaceOnUse">
            <rect className="k" x={0} y={0} width={1} height={1} />
            <rect className="k" x={1} y={1} width={1} height={1} />
          </pattern>
          <pattern id={d25} width={2} height={2} patternUnits="userSpaceOnUse">
            <rect className="k" x={0} y={0} width={1} height={1} />
          </pattern>
        </defs>

        {/* Steam puffs, shown while talking */}
        <g className="steam steam-1">
          <rect className="k" x={4} y={7} width={6} height={3} />
          <rect className="k" x={5} y={6} width={4} height={5} />
          <rect className="p" x={5} y={7} width={4} height={3} />
        </g>
        <g className="steam steam-2">
          <rect className="k" x={1} y={1} width={4} height={2} />
          <rect className="k" x={2} y={0} width={2} height={4} />
          <rect className="p" x={2} y={1} width={2} height={2} />
        </g>
        <g className="steam steam-3">
          <rect className="k" x={62} y={6} width={6} height={3} />
          <rect className="k" x={63} y={5} width={4} height={5} />
          <rect className="p" x={63} y={6} width={4} height={3} />
        </g>

        {/* Bent antenna */}
        <rect className="k" x={35} y={5} width={2} height={8} />
        <rect className="k" x={37} y={5} width={4} height={2} />
        <rect className="k" x={41} y={2} width={5} height={5} />
        <rect className="p antenna-bulb" x={42} y={3} width={3} height={3} />

        {/* Ears */}
        <rect className="k" x={5} y={24} width={6} height={15} />
        <rect className="p" x={6} y={25} width={4} height={13} />
        <rect fill={`url(#${d50})`} x={6} y={25} width={4} height={13} />
        <rect className="k" x={61} y={24} width={6} height={15} />
        <rect className="p" x={62} y={25} width={4} height={13} />
        <rect fill={`url(#${d50})`} x={62} y={25} width={4} height={13} />

        {/* Head, with notched corners and dithered shading */}
        <rect className="k" x={11} y={12} width={50} height={41} />
        <rect className="k" x={10} y={13} width={52} height={39} />
        <rect className="p" x={12} y={13} width={48} height={39} />
        <rect className="p" x={11} y={14} width={50} height={37} />
        <rect fill={`url(#${d25})`} x={54} y={14} width={6} height={37} />
        <rect fill={`url(#${d50})`} x={58} y={15} width={3} height={35} />
        <rect fill={`url(#${d25})`} x={12} y={47} width={42} height={4} />
        {/* Dent and rivets */}
        <rect className="k" x={14} y={15} width={1} height={1} />
        <rect className="k" x={57} y={15} width={1} height={1} />
        <rect className="k" x={14} y={49} width={1} height={1} />
        <rect className="g" x={46} y={14} width={3} height={1} />
        <rect className="g" x={45} y={15} width={1} height={1} />

        {/* Face screen */}
        <rect className="k" x={17} y={18} width={38} height={27} />
        <rect className="k" x={16} y={19} width={40} height={25} />
        <rect className="g screen-glare" x={18} y={20} width={4} height={1} />
        <rect className="g screen-glare" x={18} y={21} width={1} height={2} />
        <rect className="g screen-sweep" x={17} y={19} width={38} height={1} />

        <g className="face">
          {/* Angry brows slanting down toward the middle */}
          <rect className="p" x={20} y={22} width={3} height={1} />
          <rect className="p" x={23} y={23} width={3} height={1} />
          <rect className="p" x={26} y={24} width={3} height={1} />
          <rect className="p" x={29} y={25} width={2} height={1} />
          <rect className="p" x={49} y={22} width={3} height={1} />
          <rect className="p" x={46} y={23} width={3} height={1} />
          <rect className="p" x={43} y={24} width={3} height={1} />
          <rect className="p" x={41} y={25} width={2} height={1} />

          {/* Heavy-lidded eyes */}
          <g className="eyes">
            <rect className="p" x={22} y={27} width={8} height={3} />
            <rect className="k" x={28} y={27} width={2} height={1} />
            <rect className="p" x={42} y={27} width={8} height={3} />
            <rect className="k" x={42} y={27} width={2} height={1} />
            <g className="pupils">
              <rect className="k" x={24} y={28} width={2} height={2} />
              <rect className="k" x={44} y={28} width={2} height={2} />
            </g>
          </g>

          {/* Frown, shown when quiet */}
          <g className="mouth mouth-idle">
            <rect className="p" x={30} y={37} width={12} height={1} />
            <rect className="p" x={28} y={38} width={2} height={1} />
            <rect className="p" x={42} y={38} width={2} height={1} />
            <rect className="p" x={27} y={39} width={1} height={1} />
            <rect className="p" x={44} y={39} width={1} height={1} />
          </g>
          {/* Talking frame A: gritted teeth */}
          <g className="mouth mouth-a">
            <rect className="p" x={28} y={36} width={16} height={5} />
            <rect className="k" x={28} y={38} width={16} height={1} />
            <rect className="k" x={32} y={36} width={1} height={5} />
            <rect className="k" x={36} y={36} width={1} height={5} />
            <rect className="k" x={40} y={36} width={1} height={5} />
          </g>
          {/* Talking frame B: grumbling, half open */}
          <g className="mouth mouth-b">
            <rect className="p" x={31} y={37} width={10} height={3} />
            <rect className="p" x={29} y={39} width={2} height={1} />
            <rect className="p" x={41} y={39} width={2} height={1} />
          </g>
        </g>

        {/* Neck */}
        <rect className="k" x={28} y={52} width={16} height={6} />
        <rect className="p" x={29} y={53} width={14} height={1} />
        <rect className="p" x={29} y={55} width={14} height={1} />

        {/* Shoulders and chest, cut off by the counter */}
        <rect className="k" x={7} y={57} width={58} height={19} />
        <rect className="k" x={6} y={58} width={60} height={18} />
        <rect className="p" x={8} y={58} width={56} height={18} />
        <rect className="p" x={7} y={59} width={58} height={17} />
        <rect fill={`url(#${d25})`} x={56} y={59} width={9} height={17} />
        <rect className="k" x={18} y={58} width={1} height={18} />
        <rect className="k" x={53} y={58} width={1} height={18} />

        {/* Padlock on the chest */}
        <rect className="k" x={32} y={60} width={8} height={1} />
        <rect className="k" x={31} y={61} width={1} height={4} />
        <rect className="k" x={40} y={61} width={1} height={4} />
        <rect className="k" x={29} y={65} width={14} height={10} />
        <rect className="p" x={30} y={66} width={12} height={8} />
        <rect fill={`url(#${d50})`} x={39} y={66} width={3} height={8} />
        <rect className="k" x={34} y={67} width={4} height={2} />
        <rect className="k" x={35} y={69} width={2} height={3} />
      </svg>
    </div>
  )
}
