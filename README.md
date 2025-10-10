# FaceCare AI — Local Run Guide

Small README with setup and quick run steps for the project.

## Prerequisites
- Node.js (16+ recommended) and npm
- Python 3.10+ and pip
- Git (optional)

## Frontend (React + Vite)
1. Install dependencies:

   ```powershell
   npm install
   ```

2. Run dev server:

   ```powershell
   npm run dev
   ```

3. Open http://localhost:5173 (or the port printed by Vite).

Notes:
- The landing page uses the logo at `public/images/facecare.png`.
- The chat UI runs in the browser and talks to the backend at `http://localhost:5000`.

## Backend (Flask)
1. Create a virtual environment and install packages (example):

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. Set environment variables (example):

   ```powershell
   $env:THESYS_API_KEY = "your_api_key_here"
   ```

3. Run the backend:

   ```powershell
   python routes.py
   ```

The backend listens on port 5000 by default.

## Quick Test / Flow
1. Start backend, then start frontend.
2. In the app, click **Start Analysis** or navigate to the Chat page.
3. Click **New Chat** to start the 4-question profile flow. Answer the questions, the assistant will return an interactive UI (if available), then you can continue the conversation.

## Recent changes / developer notes
- New chat questionnaire flow: `src/pages/ChatPage.tsx` — clicking New Chat starts a 4-question survey; the first question now asks "What's your current age?".
- C1/interactive UI handling: frontend normalizes HTML-escaped C1 payloads and only renders interactive UI after profile completion.
- Sanitization: backend `routes.py` includes `clean_text()` and responses include `cleaned_output` to avoid showing code fences/escaped artifacts. Frontend `ChatPage` also sanitizes non-C1 assistant text before display.
- Landing page logo path updated to `/images/facecare.png`.
- Prompt improvements: `backend/prompts.py` modified to request colored/theme-aware UI and a `biologicalAgeEstimate` in assistant replies.

## Troubleshooting
- If camera scans intermittently fail, check browser permissions and backend logs at the `/analysis` endpoint; `routes.py` logs image payload info for debugging.
- If C1 UI fails to render, check console logs for the normalized payload and the `raw_output` / `cleaned_output` values returned by the backend.

## Commit message suggestion
- Short: `Fix chat flow, C1 handling, sanitization & logo`

---
Small, focused README. If you want, I can extend it with CONTRIBUTING, developer checklist, or automated test commands.