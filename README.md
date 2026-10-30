# TrustLens

**Check before you trust.** A browser extension and web app that checks messages, screenshots, calls, links, files and documents for scams, malware and tampering, and explains the risk in plain words.

**AfterHours 1.0** · Theme 02: Trust, Privacy & Digital Provenance
**Team Zenith (AH-54):** Bipin A · Darshan HS · Manoj Bharadwaj · Kaushal Ved

## What we are building

| Feature | What it does |
|---|---|
| Scam & phishing protection | Known scam patterns + OSINT threat feeds → risk score out of 100 with the exact reasons |
| Malware check | Files hashed on the device (SHA-256), matched against known-malware databases |
| Digital signature verification | Sign at the source; any edit fails verification |
| Browser extension | Right-click and popup checks on every site, no separate app |

Inputs: pasted messages, screenshots (OCR on the device), call recordings and voice notes (speech-to-text), links and files.

## Run locally

```bash
npm install
npm run dev
```

Create `.env.local`:

```
GROQ_API_KEY=your_groq_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_publishable_key
```

Run `supabase/schema.sql` once in the Supabase SQL editor.

**Extension:** open `chrome://extensions`, turn on Developer mode, click **Load unpacked** and pick the `extension/` folder. The popup talks to the server at `http://localhost:3000` (changeable under Settings).

_Work in progress. A full README follows with the final commit._
