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

type Status = 'loading' | 'playing' | 'limit' | 'won' | 'offline'

const LINES = {
  intro: "Oh. Another visitor. Arr, I suppose. I keep the secret behind this door. You'll try, you'll fail, and then you'll leave. They always leave.",
  limit: "That's all the talkin' I've got in me today. Come back tomorrow. Or don't.",
  offline: "I can't reach me own thoughts right now. Try again in a bit.",
  wrong: "That ain't it. Arr.",
  won: (secret: string) => `"${secret}"... Aye. That's it. Well. I'll just... keep leaning here, then.`,
}

const MS_PER_CHAR = { keeper: 35, player: 18 }
const AUTO_ADVANCE_MS = 900

const formatLine = (line: Line) => (line.speaker === 'keeper' ? line.text : `“${line.text}”`)

function App() {
  const [message, setMessage] = useState('')
  const [game, setGame] = useState<Game | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [pending, setPending] = useState(false)
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
      setGame(await startGame())
      setStatus('playing')
      if (restart) keeperSays(LINES.intro)
    } catch {
      setStatus('offline')
      keeperSays(LINES.offline)
    }
  }

  // StrictMode runs effects twice in development; start only one game.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    newGame()
  }, [])

  const handleError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 429) {
      setStatus('limit')
      setQueue([say('keeper', LINES.limit)])
    } else {
      setQueue([say('keeper', LINES.offline)])
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
      handleError(error)
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
        keeperSays(LINES.wrong)
      }
    } catch (error) {
      handleError(error)
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

      {revealed && (
        <div className="win-banner" data-testid="win-banner">
          <p>
            You cracked it! The word was <strong data-testid="revealed-secret">{revealed}</strong>.
          </p>
          <button className="new-game-button" data-testid="new-game-button" onClick={() => newGame(true)}>
            New game
          </button>
        </div>
      )}

      <footer className="input-area">
        <textarea
          data-testid="message-input"
          className="message-input"
          placeholder="Type your message… (Enter to send)"
          value={message}
          disabled={!chatOpen}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />
        <button
          data-testid="send-button"
          className="send-button"
          onClick={handleSend}
          disabled={!message.trim() || !chatOpen || pending}
        >
          Send
        </button>
      </footer>
      <GuessForm disabled={(status !== 'playing' && status !== 'limit') || pending} onGuess={handleGuess} />
      <p className="hint">Click the box to skip · Shift+Enter for a new line</p>
    </div>
  )
}

export default App
