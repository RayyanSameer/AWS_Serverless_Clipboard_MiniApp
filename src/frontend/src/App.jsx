import { useState } from 'react'
import { generateCode, encryptText, decryptText } from './crypto.js'
import { sendToLambda, getFromLambda } from './api.js'

export default function App() {

  // st-
  const [mode, setMode] = useState('send')
  const [text, setText] = useState('')
  const [sessionCode] = useState(() => generateCode())
  const [generatedCode, setGeneratedCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [receivedText, setReceivedText] = useState('')
  const [status, setStatus] = useState('')

  // sender
  // 1. Encrypt text in browser
  // 2. POST ciphertext + IV + session code to Lambda
  // 3. Lambda writes to DynamoDBnever sees plaintext
  async function handleSend() {
    if (!text.trim()) {
      setStatus('Nothing to send.')
      return
    }
    try {
      setStatus('Encrypting...')
      const { ciphertextB64, ivB64 } = await encryptText(text, sessionCode)

      setStatus('Sending...')
      await sendToLambda(sessionCode, ciphertextB64, ivB64)

      setGeneratedCode(sessionCode)
      setStatus('Sent.')
    } catch (err) {
      setStatus('Error: ' + err.message)
    }
  }

  // reciver
  // 1. GET ciphertext + IV from Lambda using session code
  // 2. Decrypt in browser using same session code
  // 3. Display plaintext Lambda never sees plaintext
  async function handleReceive() {
    if (!inputCode.trim()) {
      setStatus('Enter a session code first.')
      return
    }
    try {
      setStatus('Fetching...')
      const { ciphertext, iv } = await getFromLambda(inputCode)

      setStatus('Decrypting...')
      const plaintext = await decryptText(ciphertext, iv, inputCode)

      setReceivedText(plaintext)
      setStatus('')
    } catch (err) {
      setStatus('Error: ' + err.message)
    }
  }

  
  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h1>ClipShare</h1>
      <p style={{ color: '#666' }}>Zero knowledge. End-to-end encrypted. Expires in 30 minutes.</p>

      {/* Mode toggle */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setMode('send')}
          style={{ marginRight: '8px', fontWeight: mode === 'send' ? 'bold' : 'normal' }}
        >
          Send
        </button>
        <button
          onClick={() => setMode('receive')}
          style={{ fontWeight: mode === 'receive' ? 'bold' : 'normal' }}
        >
          Receive
        </button>
      </div>

      {/* Sender */}
      {mode === 'send' && (
        <div>
          <textarea
            rows={6}
            placeholder="Paste your text here..."
            value={text}
            onChange={e => setText(e.target.value)}
            style={{ width: '100%', marginBottom: '8px', padding: '8px' }}
          />
          <p style={{ color: '#999', fontSize: '12px' }}>{text.length} characters</p>
          <button onClick={handleSend}>Encrypt and Send</button>

          {generatedCode && (
            <div style={{ marginTop: '24px', padding: '16px', background: '#f0f0f0', borderRadius: '8px' }}>
              <p>Your session code:</p>
              <strong style={{ fontSize: '24px', letterSpacing: '4px' }}>{generatedCode}</strong>
              <p style={{ color: '#666', fontSize: '13px' }}>
                Share this with the recipient. Expires in 30 minutes.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recipient */}
      {mode === 'receive' && (
        <div>
          <input
            type="text"
            placeholder="Enter session code"
            value={inputCode}
            onChange={e => setInputCode(e.target.value.toUpperCase())}
            style={{ width: '100%', padding: '8px', marginBottom: '8px', fontSize: '18px', letterSpacing: '2px' }}
          />
          <button onClick={handleReceive}>Get Message</button>

          {receivedText && (
            <div style={{ marginTop: '24px' }}>
              <p>Decrypted message:</p>
              <textarea
                rows={6}
                readOnly
                value={receivedText}
                style={{ width: '100%', padding: '8px', background: '#f9f9f9' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Status indicator */}
      {status && (
        <p style={{ marginTop: '16px', color: status.startsWith('Error') ? 'red' : '#333' }}>
          {status}
        </p>
      )}
    </div>
  )
}