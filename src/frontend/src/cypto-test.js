import { describe, it, expect, beforeAll } from 'vitest'
import { generateCode, deriveKey, encryptText, decryptText } from './crypto.js'


// generateCode tests

describe('generateCode', () => {
  it('returns exactly 8 characters', () => {
    expect(generateCode()).toHaveLength(8)
  })

  it('only uses characters from the allowed set', () => {
    const code = generateCode()
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/)
  })

  it('never returns the same code twice', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateCode()))
    expect(codes.size).toBe(100)
  })
})


// deriveKey tests

describe('deriveKey', () => {
  it('returns a CryptoKey object', async () => {
    const key = await deriveKey('TESTCODE')
    expect(key).toBeInstanceOf(CryptoKey)
  })

  it('same input always produces usable key', async () => {
    const key1 = await deriveKey('TESTCODE')
    const key2 = await deriveKey('TESTCODE')
    // Both should work for encryption
    expect(key1.type).toBe('secret')
    expect(key2.type).toBe('secret')
  })
})


// encryptText tests

describe('encryptText', () => {
  it('returns ciphertextB64 and ivB64', async () => {
    const result = await encryptText('hello', 'TESTCODE')
    expect(result).toHaveProperty('ciphertextB64')
    expect(result).toHaveProperty('ivB64')
  })

  it('ciphertext is not the same as plaintext', async () => {
    const { ciphertextB64 } = await encryptText('hello', 'TESTCODE')
    expect(ciphertextB64).not.toBe('hello')
  })

  it('same input produces different IV each time', async () => {
    const r1 = await encryptText('hello', 'TESTCODE')
    const r2 = await encryptText('hello', 'TESTCODE')
    expect(r1.ivB64).not.toBe(r2.ivB64)
  })

  it('same input produces different ciphertext each time', async () => {
    const r1 = await encryptText('hello', 'TESTCODE')
    const r2 = await encryptText('hello', 'TESTCODE')
    expect(r1.ciphertextB64).not.toBe(r2.ciphertextB64)
  })
})


// decryptText tests

describe('decryptText', () => {
  it('decrypts back to original plaintext', async () => {
    const original = 'hello world'
    const code = 'TESTCODE'
    const { ciphertextB64, ivB64 } = await encryptText(original, code)
    const result = await decryptText(ciphertextB64, ivB64, code)
    expect(result).toBe(original)
  })

  it('handles long text correctly', async () => {
    const original = 'a'.repeat(10000)
    const code = 'LONGTEST'
    const { ciphertextB64, ivB64 } = await encryptText(original, code)
    const result = await decryptText(ciphertextB64, ivB64, code)
    expect(result).toBe(original)
  })

  it('handles special characters', async () => {
    const original = '你好 مرحبا 🔐 <script>alert(1)</script>'
    const code = 'SPECTEST'
    const { ciphertextB64, ivB64 } = await encryptText(original, code)
    const result = await decryptText(ciphertextB64, ivB64, code)
    expect(result).toBe(original)
  })

  it('throws with wrong session code', async () => {
    const { ciphertextB64, ivB64 } = await encryptText('secret', 'RIGHTKEY')
    await expect(
      decryptText(ciphertextB64, ivB64, 'WRONGKEY')
    ).rejects.toThrow('Invalid session code or corrupted data.')
  })

  it('throws with corrupted ciphertext', async () => {
    const { ivB64 } = await encryptText('secret', 'TESTCODE')
    await expect(
      decryptText('completelywrongdata==', ivB64, 'TESTCODE')
    ).rejects.toThrow()
  })
})