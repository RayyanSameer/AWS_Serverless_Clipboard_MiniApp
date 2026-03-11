// This file handles cryptography


// we need to generate the code
export function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const randomBytes = crypto.getRandomValues(new Uint8Array(8)) // from the set above generate an 8 char array based code

    return Array.from(randomBytes).map(b => chars[b % chars.length]).join('')

    // b here is the byte
    // here we transform the bytes into characters and glues it into a string

    // what this function does : Take input and convert each byte into a char value and glues them as one string
    // i learned about modulo bias , that's where certain remainders appear more than others making your algorithm more faster to crack.
    // This is a problem for HIPAA software but not so much for a join my room code
}




// the function down here turns a normie string into a chad AES 256 encryption key via Key Derivation
// Take this session code, add some salt, blend it 100,000 times so it's impossible to guess quickly,
// and give me back a professional-grade AES-256 key that I can use to encrypt and decrypt my files basically.

export async function deriveKey(sessionCode) {
    // encode session code as bytes
    const encoder = new TextEncoder() // text to number
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(sessionCode),
        'PBKDF2', // Password-Based Key Derivation Function 2
        false,
        ['deriveKey']
    )

    // stretch into AES 256 Key
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('clipshare-salt'),
            iterations: 100000, // speed bump for hackers
            hash: 'SHA-256' // essentially the blender
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )
}


// Pseudocode:
// 1. derive key from sessionCode
// 2. generate random IV (12 bytes)
// 3. encrypt text using AES-GCM
// 4. convert ciphertext and IV to base64
// 5. return { ciphertextB64, ivB64 }

// General Design

// SENDER:
// 1. Session code exists ("X7K2MP9Q")
// 2. deriveKey("X7K2MP9Q") → produces AES-256 key
// 3. Generate random IV (12 bytes)
// 4. AES-GCM encrypt "hello" using key + IV → produces ciphertext
// 5. Send ciphertext + IV + session_code to Lambda
// 6. Lambda stores all three in DynamoDB

// RECIPIENT:
// 1. Enters "X7K2MP9Q"
// 2. Lambda returns ciphertext + IV
// 3. deriveKey("X7K2MP9Q") → produces exact same AES-256 key
// 4. AES-GCM decrypt ciphertext using same key + same IV → "hello"

export async function encryptText(text, sessionCode) {
    const encoder = new TextEncoder()

    // Step 1 - get the key we already know how to make
    const key = await deriveKey(sessionCode)

    // Step 2 - generate random IV, fresh every time
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Step 3 - actually lock the box
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(text) // text must be bytes not string
    )

    // Step 4 - convert to base64 so we can put it in JSON
    // Raw bytes can't travel in JSON, base64 can
    const ciphertextB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
    const ivB64 = btoa(String.fromCharCode(...iv))

    // Step 5 - return both, recipient needs both
    return { ciphertextB64, ivB64 }
}


export async function decryptText(encryptedB64, ivB64, sessionCode) {
    try {
        // 1. deriveKey from sessionCode
        const key = await deriveKey(sessionCode)

        // 2. Convert base64 back to bytes (Reverse of btoa is atob)
        const encryptedBytes = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0))
        const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0))

        // 3. crypto.subtle.decrypt
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encryptedBytes
        )

        // 4. Decode result back to string
        return new TextDecoder().decode(decryptedBuffer)

    } catch (err) {
        // Handle common crypto failures
        console.error('Decryption failed:', err.name)

        if (err.name === 'OperationError') {
            throw new Error('Invalid session code or corrupted data.')
        }

        throw new Error('An unexpected error occurred during decryption.')
    }
}