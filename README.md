# AWS_Serverless_Clipboard_MiniApp

ClipShare 

    A zero-knowledge, end-to-end encrypted, serverless, ephemeral clipboard sharing application.

ClipShare allows users to securely share text snippets across devices without needing an account. By leveraging client-side encryption, a serverless AWS architecture, and automated data expiration, ClipShare guarantees that your data remains entirely private and mathematically inaccessible to the backend infrastructure.
 Key Features

     Zero-Knowledge Backend (E2EE): Text is encrypted in the browser using AES-GCM before it ever hits the network. The backend never sees your plaintext.

     Ephemeral by Design: Snippets are strictly temporary. DynamoDB Time-To-Live (TTL) automatically purges records after 30 minutes.

     Frictionless Experience: No sign-ups, no OAuth, no Cognito. Users are grouped via a secure, collision-resistant 8-character session code.

     100% Serverless: Architected for scale-to-zero and low latency using AWS Lambda, API Gateway, and DynamoDB.

     Infrastructure as Code (IaC): The entire AWS infrastructure is reproducible and deployed via Terraform.

Architecture

The application follows a clean, pull-based serverless architecture:

Frontend (React + S3 + CloudFront) * Generates an 8-character session code.

    Encrypts/decrypts text client-side via the Web Crypto API.

API Tier (AWS API Gateway - HTTP API) * Exposes lightweight GET and POST endpoints.

    Zero connection-management overhead (no WebSockets).

Compute (AWS Lambda - Python)

    send.py: Receives ciphertext + IV, writes to database.

    get.py: Retrieves ciphertext + IV based on session code.

Storage (Amazon DynamoDB)

    Fast, NoSQL storage configured with a 30-minute TTL.

 Security & Encryption Model

ClipShare's primary differentiator is its security model. The infrastructure is fundamentally incapable of reading user content.

    Code Generation: The sender's browser generates a secure 8-character alphanumeric code using crypto.getRandomValues(), omitting confusable characters (0, O, 1, I).

    Key Derivation: A symmetric encryption key is derived directly from this session code using PBKDF2.

    Encryption: The text is encrypted in the browser using AES-GCM.

    Transmission: Only the resulting ciphertext and the Initialization Vector (IV) are transmitted to the AWS backend.

    Decryption: The recipient enters the session code, derives the identical symmetric key, fetches the ciphertext and IV, and decrypts the message locally in their browser.

 Database Schema (DynamoDB)
Attribute	Type	Description
session_code	String (PK)	8-character unique identifier
ciphertext	String (Base64)	The encrypted payload
iv	String (Base64)	Initialization Vector required for AES-GCM decryption
created_at	Number	Unix timestamp of creation
ttl_expire	Number	Epoch time + 1800 seconds (Used by DynamoDB for auto-deletion)

 API Endpoints
POST /send

Stores a new encrypted snippet.

    Payload: { "session_code": "...", "ciphertext": "...", "iv": "..." }

    Response: 200 OK

GET /get?code={session_code}

Retrieves an encrypted snippet.

    Response (Success): 200 OK + { "ciphertext": "...", "iv": "..." }

    Response (Not Found / Expired): 404 Not Found

 Deployment (Terraform)

The entire stack is defined in HCL. To deploy to your AWS environment:

    Ensure AWS CLI is configured with appropriate credentials.

    Initialize Terraform:
    Bash

    terraform init

    Review the deployment plan:
    Bash

    terraform plan

    Provision the infrastructure:
    Bash

    terraform apply

(Note: The Terraform configuration enforces principle-of-least-privilege IAM roles, ensuring Lambdas can only read/write to the specific DynamoDB table).