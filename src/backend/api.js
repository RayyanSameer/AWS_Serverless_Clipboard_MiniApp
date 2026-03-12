// This is where the API calls live
// Two functions  send encrypted data to Lambda, get encrypted data from Lambda
// No crypto here. Just network. computers going boop beep.

const API_URL = 'https://vvuqy9b9ne.execute-api.ap-south-1.amazonaws.com'

export async function sendToLambda(sessionCode, ciphertextB64, ivB64) {
    // POST the already-encrypted data to Lambda
    // Lambda receives ciphertext it cannot read and stores it
    const response = await fetch(`${API_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            session_code: sessionCode,
            ciphertext: ciphertextB64,
            iv: ivB64
        })
    })

    if (!response.ok) {
        throw new Error('Failed to send. Try again.')
    }

    return response.json()
}

export async function getFromLambda(sessionCode) {
    // get ciphertext from Lambda using session code
    // Returns raw encrypted data decryption happens in crypto.js not here
    const response = await fetch(`${API_URL}/get?session_code=${sessionCode}`)

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Code not found or expired.')
        }
        throw new Error('Failed to retrieve message.')
    }

    return response.json()
    // returns { ciphertext, iv } still encrypted, caller handles decryption
}