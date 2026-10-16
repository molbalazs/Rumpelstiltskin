import { useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    // wired up in a future iteration
    console.log('send:', message)
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
        <div className="placeholder-message">
          Start a game to begin chatting with the keeper.
        </div>
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
    </div>
  )
}

export default App
