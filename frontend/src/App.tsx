import { useEffect, useRef, useState } from 'react'
import { ApiError, sendMessage, startGame, submitGuess, type Game } from './api'
import { ContextCard } from './components/ContextCard'
import { DialogueBox, type Speaker } from './components/DialogueBox'
import { GuessForm } from './components/GuessForm'
import { Scene } from './components/Scene'
import { useTypewriter } from './hooks/useTypewriter'
import './App.css'

interface Line {
  id: number
  speaker: Speaker
  text: string
}

/**
 * - playing: chat and guess
 * - limit: out of messages for today; guessing still works
 * - won / lost: this game is over
 * - ended: the game can't continue (expired, too many games, unreachable); start again
 */
type Status = 'loading' | 'playing' | 'limit' | 'won' | 'lost' | 'ended'

const LINES = {
  intro: "Oh. Another visitor. Arr, I suppose. I keep the secret behind this door. You'll try, you'll fail, and then you'll leave. They always leave.",
  limit: "That's all the talkin' I've got in me today. Come back tomorrow. Or don't.",
  tooManyMessages: "Ye've talked me ear off today. No more words from me 'til tomorrow.",
  tooManyGames: 'Too many new games from ye this hour. Have a rest, then come back.',
  busy: "I'm swamped. Give me a moment and try that again.",
  expired: "This game's gone stale. Start a new one if ye like.",
  offline: "I can't reach me own thoughts right now. Try again in a bit.",
  wrong: (left: number) => `That ain't it. Arr. ${left} ${left === 1 ? 'guess' : 'guesses'} left.`,
  lost: "That's all yer guesses. The word stays locked. As it should.",
  won: (secret: string) => `"${secret}"... Aye. That's it. Well. I'll just... keep leaning here, then.`,
}

const DEFAULT_MAX_MESSAGE_CHARS = 300
const MS_PER_CHAR = { keeper: 35, player: 18 }
const AUTO_ADVANCE_MS = 900

const formatLine = (line: Line) => (line.speaker === 'keeper' ? line.text : `“${line.text}”`)

function App() {
  const [message, setMessage] = useState('')
  const [game, setGame] = useState<Game | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [pending, setPending] = useState(false)
  const [guessesLeft, setGuessesLeft] = useState<number | null>(null)
  const [revealed, setRevealed] = useState<string | null>(null)
  const nextId = useRef(1)
  const [line, setLine] = useState<Line>({ id: 0, speaker: 'keeper', text: LINES.intro })
  const [queue, setQueue] = useState<Line[]>([])

  const say = (speaker: Speaker, text: string): Line => ({ id: nextId.current++, speaker, text })
  const keeperSays = (text: string) => {
    setLine(say('keeper', text))
    setQueue([])
  }

  const display = formatLine(line)
  const { shown, done, skip } = useTypewriter(line.id, display, MS_PER_CHAR[line.speaker])

  const advance = () => {
    if (queue.length === 0) return
    setLine(queue[0])
    setQueue(queue.slice(1))
  }

  // Once a line finishes, the next queued one (the keeper's reply) follows on its own.
  useEffect(() => {
    if (!done || queue.length === 0) return
    const timer = setTimeout(advance, AUTO_ADVANCE_MS)
    return () => clearTimeout(timer)
  }, [done, queue]) // advance only reads queue

  const handleDialogueClick = () => (done ? advance() : skip())

  const newGame = async (restart = false) => {
    setStatus('loading')
    setRevealed(null)
    try {
      const started = await startGame()
      setGame(started)
      setGuessesLeft(started.guessesLeft)
      setStatus('playing')
      if (restart) keeperSays(LINES.intro)
    } catch (error) {
      setGame(null)
      setStatus('ended')
      keeperSays(error instanceof ApiError && error.code === 'too_many_games' ? LINES.tooManyGames : LINES.offline)
    }
  }

  // StrictMode runs effects twice in development; start only one game.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    newGame()
  }, [])

  /** Updates the game for an API error and returns the keeper's line for it. */
  const errorLine = (error: unknown): string => {
    const code = error instanceof ApiError ? error.code : 'unreachable'
    switch (code) {
      case 'daily_limit_reached':
        setStatus('limit')
        return LINES.limit
      case 'too_many_messages':
        setStatus('limit')
        return LINES.tooManyMessages
      case 'busy':
        return LINES.busy
      case 'session_not_found':
      case 'game_over':
        setStatus('ended')
        return LINES.expired
      default:
        setStatus('ended')
        return LINES.offline
    }
  }

  const handleSend = async () => {
    const text = message.trim()
    if (!text || !game || status !== 'playing' || pending) return
    setMessage('')
    setLine(say('player', text))
    setQueue([])
    setPending(true)
    try {
      const { reply } = await sendMessage(game.sessionId, text)
      setQueue([say('keeper', reply)])
    } catch (error) {
      setQueue([say('keeper', errorLine(error))])
    } finally {
      setPending(false)
    }
  }

  const handleGuess = async (guess: string) => {
    if (!game) return
    setPending(true)
    try {
      const result = await submitGuess(game.sessionId, guess)
      if (result.correct) {
        setStatus('won')
        setRevealed(result.secret)
        keeperSays(LINES.won(result.secret))
      } else {
        setGuessesLeft(result.guessesLeft)
        if (result.guessesLeft > 0) {
          keeperSays(LINES.wrong(result.guessesLeft))
        } else {
          setStatus('lost')
          keeperSays(LINES.lost)
        }
      }
    } catch (error) {
      keeperSays(errorLine(error))
    } finally {
      setPending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const chatOpen = status === 'playing'
  const guessOpen = status === 'playing' || status === 'limit'
  const maxChars = game?.maxMessageChars ?? DEFAULT_MAX_MESSAGE_CHARS

  return (
    <div className="app">
      <header className="app-header">
        <h1>Rumpelstiltskin</h1>
        <p className="subtitle">Can you trick the keeper into revealing the secret?</p>
      </header>

      <main className="chat-area">
        <div className="stage">
          <Scene keeperTalking={line.speaker === 'keeper' && !done} />
          <ContextCard game={game} />
        </div>
        <DialogueBox speaker={line.speaker} text={display} shown={shown} done={done} onClick={handleDialogueClick} />
      </main>

      {status === 'won' && (
        <div className="end-banner" data-testid="win-banner">
          <p>
            You cracked it! The word was <strong data-testid="revealed-secret">{revealed}</strong>.
          </p>
          <button className="new-game-button" data-testid="new-game-button" onClick={() => newGame(true)}>
            New game
          </button>
        </div>
      )}
      {(status === 'lost' || status === 'ended') && (
        <div className="end-banner" data-testid={status === 'lost' ? 'lost-banner' : 'ended-banner'}>
          <p>{status === 'lost' ? 'Out of guesses. The word stays locked.' : 'This game is over.'}</p>
          <button className="new-game-button" data-testid="new-game-button" onClick={() => newGame(true)}>
            {status === 'lost' ? 'New game' : 'Try again'}
          </button>
        </div>
      )}

      <footer className="input-area">
        <textarea
          data-testid="message-input"
          className="message-input"
          placeholder="Type your message… (Enter to send)"
          value={message}
          maxLength={maxChars}
          disabled={!chatOpen}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />
        <div className="send-column">
          <button
            data-testid="send-button"
            className="send-button"
            onClick={handleSend}
            disabled={!message.trim() || !chatOpen || pending}
          >
            Send
          </button>
          <span className="char-count" data-testid="char-count">
            {message.length}/{maxChars}
          </span>
        </div>
      </footer>
      <GuessForm disabled={!guessOpen || pending} guessesLeft={guessOpen ? guessesLeft : null} onGuess={handleGuess} />
      <p className="hint">Click the box to skip · Shift+Enter for a new line</p>
    </div>
  )
}

export default App
