# Kannada Mitra — Gemini AI Tutor Architecture & Security Plan

## 1. Overview
The planned **Gemini AI Tutor** will act as an interactive conversational tutor for Kannada Mitra users. It is designed to:
* Explain Kannada vocabulary, idioms, and sentences in the user's preferred mother tongue (e.g. Hindi, Telugu, Tamil, Malayalam, Marathi, English).
* Answer questions about pronunciation and regional variations across Karnataka.
* Role-play everyday conversations (ordering food at a darshini, asking auto drivers for fares, shopping in markets).
* Explain Kannada grammar (tenses, respect markers like *ರಿ / ri*, suffixes like *ಗೆ / ge* and *ಅಲ್ಲಿ / alli*).
* Correct sentence mistakes with gentle explanations in the user's native language.

---

## 2. Security Architecture & Key Management

### Absolute Rule: Zero Browser-Side Keys
* The Google AI Studio Gemini API key must **NEVER** be placed in React components, `.env`, or browser JavaScript bundles.
* **Never use** `VITE_GEMINI_API_KEY` (any `VITE_` prefix causes Vite to bundle the key directly into client-side JS, exposing it to any user inspecting browser network requests or sources).
* The Gemini key must remain strictly on the backend.

### Architecture Diagram

```
[ Browser / Client ]
  | (Sends user question + Firebase Auth ID Token)
  v
[ Firebase Cloud Function (Node.js) ]
  | - Verifies Firebase Auth token (auth.uid)
  | - Enforces per-user rate limiting (e.g. 15 requests/min)
  | - Reads GEMINI_API_KEY from Google Cloud Secret Manager
  | - Injects verified system instructions (Kannada Tutor prompt)
  v
[ Google Gemini API (gemini-3.8-flash) ]
  |
  v
[ Firebase Cloud Function returns JSON response ]
  |
  v
[ Browser displays response with AI Disclaimer Badge ]
```

---

## 3. Recommended Gemini Model & Quotas

* **Configured Model**: `gemini-3.8-flash`.
  * Optimized for low latency, sub-second token streaming, and multi-lingual Indian languages (Kannada, Telugu, Tamil, Hindi, Malayalam, Marathi, Bengali, Urdu).
* **Free-Tier Limits (Google AI Studio)**:
  * **15 RPM** (Requests Per Minute)
  * **1,000,000 TPM** (Tokens Per Minute)
  * **1,500 RPD** (Requests Per Day)
* **Cost & Paid Tier Considerations**:
  * Free tier is completely cost-free and suitable for hackathon demonstrations and moderate traffic.
  * Free tier data may be used by Google for model quality improvement. If enterprise privacy guarantees are required later, upgrading to Pay-As-You-Go provides data exclusion terms at very low cost (~$0.075 per 1M input tokens).

---

## 4. Implementation Steps When Ready to Deploy

1. Initialize Firebase Cloud Functions in the project:
   ```bash
   firebase init functions
   ```
2. Store the Gemini API key in Firebase Secrets:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```
3. Deploy the Cloud Function:
   ```bash
   firebase deploy --only functions
   ```
4. The client will query the Cloud Function endpoint defined in `src/services/aiTutorContract.js`.
