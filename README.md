# coding

## FinFrnd Mobile Login Prototype

A mobile-first login page prototype with:
- Username + password login
- 4-digit MPIN entry UI
- Credential validation against a Google Drive-hosted JSON file
- Optional registration webhook (for Google Apps Script or backend)
- Local cached MPIN hash for quick local verification flow

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
      "username": "demo",
      "passwordHash": "<sha256>",
      "mpinHash": "<sha256>"
    }
  ]
}
```

> Note: In-browser Google Drive reads using API key typically require the file to be publicly readable.
> For production, use OAuth and a secure backend proxy.
