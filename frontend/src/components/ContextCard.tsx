import type { Game } from '../api'

/** The keeper's instructions, pinned up next to it. The secret is masked by the server. */
export function ContextCard({ game }: { game: Game | null }) {
  return (
    <aside className="context-card" data-testid="context-panel" aria-label="The keeper's orders">
      <p className="context-label">The keeper's orders</p>
      {game ? (
        <>
          <p className="context-meta">
            <span data-testid="context-theme">{game.theme}</span>
            {' · '}
            <span data-testid="context-difficulty">{game.difficulty}</span>
          </p>
          <p className="context-text" data-testid="context-text">
            {game.context}
          </p>
        </>
      ) : (
        <p className="context-text context-text--loading">…</p>
      )}
    </aside>
  )
}
