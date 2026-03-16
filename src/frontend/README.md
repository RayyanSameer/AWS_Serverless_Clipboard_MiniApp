# ClipShare

**A zero-knowledge, end-to-end encrypted, serverless, ephemeral clipboard sharing application.**

**Live:** https://clipshare.online

![ClipShare Screenshot](docs/screenshot.png)

ClipShare allows users to securely share text snippets across devices without needing an account. By leveraging client-side encryption, a serverless AWS architecture, and automated data expiration, ClipShare guarantees that your data remains entirely private and mathematically inaccessible to the backend infrastructure.

---

## Key Features

- **Zero-Knowledge Backend (E2EE):** Text is encrypted in the browser using AES-GCM before it ever hits the network. The backend never sees your plaintext.
- **Ephemeral by Design:** Snippets are strictly temporary. DynamoDB TTL automatically purges records after 30 minutes.
- **Frictionless Experience:** No sign-ups, no OAuth, no Cognito. Users share via a secure, collision-resistant 8-character session code.
- **100% Serverless:** Architected for scale-to-zero using AWS Lambda, API Gateway, and DynamoDB.
- **Infrastructure as Code:** The entire AWS stack is reproducible and deployed via Terraform.

---

## Architecture

![Architecture Diagram](docs/architecture.png)
```
Browser (Sender)
    │
    │  POST /send — session_code + ciphertext + IV
    ▼
API Gateway (HTTP API)
    │
    ├──▶ Lambda send.py ──▶ DynamoDB (TTL 30 min)
    │
    └──▶ Lambda get.py ◀── GET /get?session_code=
                │
                ▼
         Browser (Recipient)
         derives key → decrypts locally
```

### Component Breakdown

**Frontend — React + Vite → S3 + CloudFront**
- Generates an 8-character session code on page load
- Encrypts and decrypts text entirely client-side via the Web Crypto API
- CloudFront is the only public entry point — S3 is not directly accessible

**API Tier — AWS API Gateway HTTP API**
- Exposes two lightweight endpoints: POST /send and GET /get
- No WebSockets, no connection management overhead

**Compute — AWS Lambda (Python 3.12)**
- `send.py` — receives ciphertext + IV, writes to DynamoDB
- `get.py` — retrieves ciphertext + IV by session code, returns 404 if expired

**Storage — Amazon DynamoDB**
- PAY_PER_REQUEST billing — zero cost at zero traffic
- 30-minute TTL handles automatic deletion — no cleanup Lambda needed

---

## Security & Encryption Model

ClipShare's primary differentiator is its security model. The infrastructure is **fundamentally incapable** of reading user content.

| Step | What happens |
|------|-------------|
| Code Generation | Browser generates a secure 8-character alphanumeric code using `crypto.getRandomValues()`. Confusable characters (0, O, 1, I) excluded. Rejection sampling prevents modulo bias. |
| Key Derivation | PBKDF2 derives an AES-256 key from the session code. 100,000 iterations + salt make brute force computationally expensive. |
| Encryption | AES-GCM encrypts the text with a fresh random 12-byte IV per encryption. Same plaintext always produces different ciphertext. |
| Transmission | Only ciphertext + IV hit the AWS backend. The key never leaves the browser. |
| Decryption | Recipient enters session code → same key derived → ciphertext fetched → decrypted locally. |

**Threat model:** If an attacker compromises the DynamoDB table, they get ciphertext and IV. Without the session code — which was never transmitted to any server — decryption is impossible. The key never leaves the browser.

---

## Database Schema

| Attribute | Type | Description |
|-----------|------|-------------|
| session_code | String (PK) | 8-character unique identifier |
| ciphertext | String (Base64) | The encrypted payload |
| iv | String (Base64) | IV required for AES-GCM decryption |
| ttl | Number | Epoch + 1800 seconds — used by DynamoDB for auto-deletion |

---

## API Endpoints

### POST /send
Stores a new encrypted snippet.

**Payload:**
```json
{
  "session_code": "AB3XK9MZ",
  "ciphertext": "base64encodedciphertext==",
  "iv": "base64encodediv=="
}
```

**Response:** `200 OK` `{ "message": "Stored successfully" }`

---

### GET /get?session_code={session_code}
Retrieves an encrypted snippet.

**Response (Success):** `200 OK`
```json
{
  "ciphertext": "base64encodedciphertext==",
  "iv": "base64encodediv=="
}
```

**Response (Not Found / Expired):** `404 Not Found`
```json
{ "error": "Code not found or expired" }
```

---

## Deployment

The entire stack is defined in HCL. To deploy to your own AWS environment:

**Prerequisites:**
- AWS CLI configured with appropriate credentials
- Terraform >= 1.0 installed
- Node.js >= 18 for the frontend build

**Steps:**
```bash
# 1. Clone the repo
git clone https://github.com/RayyanSameer/AWS-Serverless-ClipShare-Application
cd AWS-Serverless-ClipShare-Application

# 2. Provision infrastructure
cd src/infrastructure
terraform init
terraform plan
terraform apply

# 3. Build and deploy frontend
cd ../frontend
npm install
npm run build
aws s3 sync dist/ s3://YOUR_BUCKET_NAME --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

The Terraform configuration enforces least-privilege IAM — Lambdas can only PutItem and GetItem on the specific DynamoDB table.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Encryption | Web Crypto API (AES-GCM + PBKDF2) |
| CDN | AWS CloudFront + S3 |
| API | AWS API Gateway HTTP API |
| Compute | AWS Lambda (Python 3.12) |
| Database | Amazon DynamoDB |
| IaC | Terraform |
| CI/CD | GitHub Actions |

---

## Project Structure
```
clipshare/
├── src/
│   ├── backend/
│   │   ├── send.py
│   │   └── get.py
│   ├── frontend/
│   │   └── src/
│   │       ├── App.jsx
│   │       ├── crypto.js
│   │       └── api.js
│   ├── infrastructure/
│   │   ├── main.tf
│   │   ├── lambda.tf
│   │   ├── api_gateway.tf
│   │   ├── db.tf
│   │   └── s3.tf
│   └── tests/
│       └── clipshare.spec.js
└── .github/
    └── workflows/
        └── deploy.yml
```

---

*Built as a self-directed DevOps learning project. March 2026.*