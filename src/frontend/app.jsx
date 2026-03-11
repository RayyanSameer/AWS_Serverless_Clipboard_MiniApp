import { useState } from 'react'
import { generateCode, encryptText, decryptText } from './crypto.js'
import { sendToLambda, getFromLambda } from './api.js'

export default function App() {

 
  // Everything the UI needs to remember lives here
  const [mode, setMode] = useState('send')
  const [text, setText] = useState('')
  const [sessionCode] = useState(() => generateCode())
  const [generatedCode, setGeneratedCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [receivedText, setReceivedText] = useState('')
  const [status, setStatus] = useState('')

  // handy bois (handlers)
  

  async function handleSend() {
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

  async function handleReceive() {
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

  // ui
  return (
    <div>
      <h1>ClipShare</h1>
      <p>Zero knowledge. Expires in 30 minutes.</p>

      <button onClick={() => setMode('send')}>Send</button>
      <button onClick={() => setMode('receive')}>Receive</button>

      {mode === 'send' && (
        <div>
          <textarea
            rows={6}
            placeholder="Paste text here..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button onClick={handleSend}>Encrypt and Send</button>

          {generatedCode && (
            <div>
              <p>Your code:</p>
              <strong>{generatedCode}</strong>
              <p>Share this with the recipient. Expires in 30 minutes.</p>
            </div>
          )}
        </div>
      )}

      {mode === 'receive' && (
        <div>
          <input
            type="text"
            placeholder="Enter session code"
            value={inputCode}
            onChange={e => setInputCode(e.target.value)}
          />
          <button onClick={handleReceive}>Get Message</button>

          {receivedText && (
            <textarea rows={6} readOnly value={receivedText} />
          )}
        </div>
      )}

      {status && <p>{status}</p>}
    </div>
  )
}