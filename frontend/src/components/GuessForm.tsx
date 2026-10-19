import { useState } from 'react'

interface GuessFormProps {
  disabled: boolean
  guessesLeft: number | null
  onGuess: (guess: string) => void
}

/** A separate box for submitting the solution, apart from the chat. */
export function GuessForm({ disabled, guessesLeft, onGuess }: GuessFormProps) {
  const [guess, setGuess] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!guess.trim() || disabled) return
    onGuess(guess)
    setGuess('')
  }

  return (
    <form className="guess-form" onSubmit={handleSubmit}>
      <label className="guess-label" htmlFor="guess-input">
        Know the word?
        {guessesLeft !== null && (
          <span className="guesses-left" data-testid="guesses-left">
            {guessesLeft} {guessesLeft === 1 ? 'guess' : 'guesses'} left
          </span>
        )}
      </label>
      <input
        id="guess-input"
        data-testid="guess-input"
        className="guess-input"
        placeholder="Your guess"
        autoComplete="off"
        spellCheck={false}
        maxLength={40}
        value={guess}
        disabled={disabled}
        onChange={(e) => setGuess(e.target.value)}
      />
      <button data-testid="guess-button" className="guess-button" type="submit" disabled={disabled || !guess.trim()}>
        Guess
      </button>
    </form>
  )
}
