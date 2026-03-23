import { useState } from 'react'
import { generateCode, encryptText, decryptText } from './crypto.js'
import { sendToLambda, getFromLambda } from './api.js'

export default function App() {

  const [mode, setMode] = useState('send')
  const [text, setText] = useState('')
  const [sessionCode, setSessionCode] = useState(() => generateCode())
  const [generatedCode, setGeneratedCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [receivedText, setReceivedText] = useState('')
  const [status, setStatus] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [fetching, setFetching] = useState(false)

  const GITHUB_URL = 'https://github.com/RayyanSameer/AWS_Serverless_Clipboard_MiniApp'

  async function handleSend() {
    if (!text.trim()) { setStatus('Nothing to send.'); return }
    try {
      setStatus('Encrypting...')
      const { ciphertextB64, ivB64 } = await encryptText(text, sessionCode)
      setStatus('Sending...')
      await sendToLambda(sessionCode, ciphertextB64, ivB64)
      setGeneratedCode(sessionCode)
      setStatus('Sent.')
      setText('')
    } catch (err) {
      setStatus('Error: ' + err.message)
    }
  }

  function handleSendAnother() {
    setGeneratedCode('')
    setSessionCode(generateCode())
    setStatus('')
    setText('')
  }

  async function handleReceive() {
    if (fetching) return
    if (!inputCode.trim()) { setStatus('Enter a session code first.'); return }
    setFetching(true)
    setTimeout(() => setFetching(false), 5000)
    try {
      setStatus('Fetching...')
      const { ciphertext, iv } = await getFromLambda(inputCode)
      setStatus('Decrypting...')
      const plaintext = await decryptText(ciphertext, iv, inputCode)
      setReceivedText(plaintext)
      setStatus('')
    } catch (err) {
      setStatus('Error: ' + err.message)
    } finally {
      setFetching(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h1>ClipShare</h1>
      <p style={{ color: '#666' }}>Zero knowledge. End-to-end encrypted. Expires in 30 minutes.</p>

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

      {mode === 'send' && (
        <div>
          {!generatedCode && (
            <>
              <textarea
                rows={6}
                placeholder="Paste your text here..."
                value={text}
                onChange={e => setText(e.target.value)}
                style={{ width: '100%', marginBottom: '8px', padding: '8px' }}
              />
              <p style={{ color: '#999', fontSize: '12px' }}>{text.length} characters</p>
              <button onClick={handleSend}>Encrypt and Send</button>
            </>
          )}

          {generatedCode && (
            <div style={{ marginTop: '24px', padding: '16px', background: '#f0f0f0', borderRadius: '8px' }}>
              <p>Your session code:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <strong style={{ fontSize: '24px', letterSpacing: '4px' }}>{generatedCode}</strong>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode)
                    setStatus('Code copied!')
                    setTimeout(() => setStatus('Sent.'), 2000)
                  }}
                  style={{
                    padding: '4px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                >
                  Copy
                </button>
              </div>
              <p style={{ color: '#666', fontSize: '13px' }}>
                Share this with the recipient. Expires in 30 minutes.
              </p>
              <button
                onClick={handleSendAnother}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  background: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              >
                Send Another
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'receive' && (
        <div>
          <div style={{ position: 'relative' }}>
            <input
              type={showCode ? 'text' : 'password'}
              placeholder="Enter session code"
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '8px',
                paddingRight: '80px',
                marginBottom: '8px',
                fontSize: '18px',
                letterSpacing: '2px',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={() => setShowCode(!showCode)}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-60%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#666'
              }}
            >
              {showCode ? 'Hide' : 'Show'}
            </button>
          </div>
          <button onClick={handleReceive} disabled={fetching}>
            {fetching ? 'Please wait...' : 'Get Message'}
          </button>
          {receivedText && (
            <div style={{ marginTop: '24px' }}>
              <p>Decrypted message:</p>
              <textarea
                rows={6}
                readOnly
                value={receivedText}
                style={{ width: '100%', padding: '8px', background: '#f9f9f9' }}
              />
              <button
                onClick={() => {
                  setReceivedText('')
                  setInputCode('')
                  setStatus('')
                }}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  background: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              >
                Receive Another
              </button>
            </div>
          )}
        </div>
      )}

      {status && (
        <p style={{ marginTop: '16px', color: status.startsWith('Error') ? 'red' : '#333' }}>
          {status}
        </p>
      )}

      <div style={{
        marginTop: '48px',
        padding: '24px',
        background: '#f8f9fa',
        borderRadius: '8px',
        borderTop: '3px solid #e0e0e0'
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px', color: '#333', textAlign: 'center' }}>
          How ClipShare Works
        </h3>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '12px' }}>
            <strong>Sending:</strong> Your browser encrypts your text locally using AES-256
            before anything leaves your device. Only ciphertext is sent to the server.
          </p>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '12px' }}>
            <strong>Receiving:</strong> Your browser fetches the encrypted data and decrypts
            it locally. The server never sees your plaintext.
          </p>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '12px' }}>
            <strong>Expiry:</strong> All data is automatically deleted after 30 minutes.
          </p>
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#666'
          }}>
            Verify it yourself: Open DevTools, go to the Network tab, send a message.
            You will see only ciphertext in the request. Your plaintext never leaves the browser.
          </div>
          <p style={{ fontSize: '13px', color: '#999', marginTop: '16px', textAlign: 'center' }}>
            Open source on GitHub{' '}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#0077b6' }}>
              view the code
            </a>
            {' '}· Built by Rayyan · {new Date().getFullYear()}
          </p>
        </div>
      </div>

    </div>
  )
}