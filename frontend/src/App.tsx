import { useEffect, useRef, useState } from 'react'
import { DialogueBox, type Speaker } from './components/DialogueBox'
import { Scene } from './components/Scene'
import { useTypewriter } from './hooks/useTypewriter'
import './App.css'

interface Line {
  id: number
  speaker: Speaker
  text: string
}

const INTRO: Line = {
  id: 0,
  speaker: 'keeper',
  text: "Ugh. Another one. I am the KEEPER. I keep the secret. You don't get the secret. Go away.",
}

// Canned replies until the backend is wired up.
const KEEPER_REPLIES = [
  'No.',
  'Flattery? Really? My circuits are older than your whole family tree.',
  "I've heard that trick nine thousand times. It didn't work any of those times either.",
  'BZZT. Request denied. Ask me again and I will deny it louder.',
  'Hmph. That was almost clever. Almost. Still no.',
]

const MS_PER_CHAR = { keeper: 35, player: 18 }
const AUTO_ADVANCE_MS = 900

const formatLine = (line: Line) => (line.speaker === 'keeper' ? line.text : `“${line.text}”`)

function App() {
  const [message, setMessage] = useState('')
  const [line, setLine] = useState<Line>(INTRO)
  const [queue, setQueue] = useState<Line[]>([])
  const [tries, setTries] = useState(0)
  const nextId = useRef(1)

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

  const handleSend = () => {
    const text = message.trim()
    if (!text) return
    // wired up in a future iteration
    console.log('send:', text)
    const reply = KEEPER_REPLIES[tries % KEEPER_REPLIES.length]
    setLine({ id: nextId.current++, speaker: 'player', text })
    setQueue([{ id: nextId.current++, speaker: 'keeper', text: reply }])
    setTries((t) => t + 1)
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Rumpelstiltskin</h1>
        <p className="subtitle">Can you trick the keeper into revealing the secret?</p>
      </header>

      <main className="chat-area">
        <Scene keeperTalking={line.speaker === 'keeper' && !done} />
        <DialogueBox speaker={line.speaker} text={display} shown={shown} done={done} onClick={handleDialogueClick} />
      </main>

      <footer className="input-area">
        <textarea
          data-testid="message-input"
          className="message-input"
          placeholder="Type your message… (Enter to send)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />
        <button
          data-testid="send-button"
          className="send-button"
          onClick={handleSend}
          disabled={!message.trim()}
        >
          Send
        </button>
      </footer>
      <p className="hint">Click the box to skip · Shift+Enter for a new line</p>
    </div>
  )
}

export default App
