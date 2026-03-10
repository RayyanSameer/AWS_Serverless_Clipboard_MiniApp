import { useState } from 'react'

export default function App() {
  const [mode, setMode] = useState('send') // 'send' or 'receive'
  const [text, setText] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [receivedText, setReceivedText] = useState('')

  return (
    <div className="app">
      <h1>ClipShare</h1>
      <p>Secure, encrypted, ephemeral clipboard sharing</p>

      {/* Mode toggle */}
      <div className="mode-toggle">
        <button onClick={() => setMode('send')}>Send</button>
        <button onClick={() => setMode('receive')}>Receive</button>
      </div>

      {/* Sender UI */}
      {mode === 'send' && (
        <div className="send-panel">
          <textarea
            rows={6}
            placeholder="Paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p>Characters: {text.length}</p>
          <button onClick={() => handleSend()}>
            Encrypt and Send
          </button>
          {generatedCode && (
            <div className="code-display">
              <p>Your code:</p>
              <strong>{generatedCode}</strong>
              <p>Share this with the recipient. Expires in 30 minutes.</p>
            </div>
          )}
        </div>
      )}

      {/* Recipient UI */}
      {mode === 'receive' && (
        <div className="receive-panel">
          <input
            type="text"
            placeholder="Enter session code"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value)}
          />
          <button onClick={() => handleReceive()}>
            Get Message
          </button>
          {receivedText && (
            <div className="received-text">
              <p>Your message:</p>
              <textarea rows={6} readOnly value={receivedText} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}