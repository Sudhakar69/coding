# coding

## FinFrnd Mobile Login Prototype

A mobile-first banking-style login prototype with:
- 6-digit MPIN login
- Credentials validated from a Google Drive-hosted JSON file
- Local MPIN hash caching for faster device-side unlock readiness
- Face ID / fingerprint login using WebAuthn passkeys
- Optional registration webhook for new users

### Run locally

```bash
cd wellness-app
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

### Google Drive credential file format

```json
{
  "users": [
    {
      "mpinHash": "<sha256>"
    }
  ]
}
```

> Note: Browser-side Google Drive API key access usually requires the credential file to be publicly readable.
> For production, move credential verification and WebAuthn challenge validation to a secure backend.
