# Explainly (frontend)

Next.js app for AI chat, portfolio holdings, broker integrations, and credits—talks to a **FastAPI** backend via cookie-based sessions and a same-origin `/api/proxy` for browser requests.

## Requirements

- Node.js 20+ (matches Next.js 16)
- A running FastAPI API (default: `http://localhost:8000`)

## Setup

```bash
npm install
```

Optional: create **`.env.local`** and set **`NEXT_PUBLIC_FASTAPI_URL`** to your API origin (defaults to `http://localhost:8000` if unset).

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Dev server               |
| `npm run build`| Production build         |
| `npm run start`| Run production build     |
| `npm run lint` | ESLint                   |

## Stack (high level)

Next.js (App Router) · React · Redux Toolkit · Tailwind CSS · Radix UI

---

Backend and DB live in the separate **FastAPI** service; see that repo’s README for migrations and env vars.
