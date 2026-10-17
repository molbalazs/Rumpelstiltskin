export type Speaker = 'keeper' | 'player'

interface DialogueBoxProps {
  speaker: Speaker
  /** The complete line. */
  text: string
  /** The part revealed so far by the typewriter. */
  shown: string
  done: boolean
  onClick: () => void
}

export function DialogueBox({ speaker, text, shown, done, onClick }: DialogueBoxProps) {
  return (
    <div className={`dialogue dialogue--${speaker}`} onClick={onClick} data-testid="dialogue-box">
      <span className="dialogue-name">{speaker === 'keeper' ? 'KEEPER' : 'YOU'}</span>
      {/* The full line for screen readers; the animated copy is decorative. */}
      <p className="sr-only" aria-live="polite">
        {text}
      </p>
      <p className="dialogue-text" aria-hidden="true">
        {shown}
        {/* Unrevealed text keeps its space so words don't jump between lines. */}
        <span className="dialogue-ghost">{text.slice(shown.length)}</span>
      </p>
      {done && (
        <svg className="dialogue-cursor" viewBox="0 0 7 4" shapeRendering="crispEdges" aria-hidden="true">
          <rect x={0} y={0} width={7} height={1} />
          <rect x={1} y={1} width={5} height={1} />
          <rect x={2} y={2} width={3} height={1} />
          <rect x={3} y={3} width={1} height={1} />
        </svg>
      )}
    </div>
  )
}
