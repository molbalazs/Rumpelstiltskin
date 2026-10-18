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
        <svg className="dialogue-cursor" viewBox="0 0 20 14" aria-hidden="true">
          <path d="M 2 2.5 Q 10 1 18 3 Q 14 8 10.5 12.5 Q 6 8 2 2.5 Z" />
        </svg>
      )}
    </div>
  )
}
