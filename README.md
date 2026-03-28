# MERN App - FutureBlink Task

This project is a MERN-style app with:

- React + React Flow frontend (TypeScript)
- Node.js + Express backend (native TypeScript)
- OpenRouter API call from backend only
- MongoDB save endpoint

## Features

- Input Node: type prompt text directly inside a React Flow node
- Result Node: displays AI response in a connected node
- Run Flow button: calls backend `/api/ask-ai`
- Save button: stores prompt + response to MongoDB via `/api/flows/save`

## Folder Structure

- `client/` React app
- `server/` Express API
- `package.json` root scripts for running both apps

## Prerequisites

- Node.js 22.6+ (recommended: latest Node 22/24/25)
- MongoDB (local or Atlas)
- OpenRouter API key

## Environment Setup

1. In `server/`, create `.env` from `.env.example`.
2. Fill values:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/mern-flow
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-3.1-flash-lite-preview
SITE_URL=http://localhost:5173
SITE_NAME=MERN Flow Demo
```

Optional frontend API base URL in `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Install

Dependencies are split by folder:

```bash
npm install
cd server && npm install
cd ../client && npm install
```

## Run (Development)

From root:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Build

From root:

```bash
npm run build
```

## Deploy To Vercel

Deploy frontend and backend as two Vercel projects from the same repo.

1. Frontend project

- Root Directory: `client`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment: `VITE_API_BASE_URL=https://<your-backend>.vercel.app`

2. Backend project

- Root Directory: `server`
- Uses `server/vercel.json` and `server/api/index.ts`
- Environment variables: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `MONGODB_URI`, `SITE_URL`, `SITE_NAME`

## Type Check

From root:

```bash
npm run typecheck
```

## API Endpoints

- `POST /api/ask-ai`
  - Body: `{ "prompt": "your text" }`
  - Returns: `{ "answer": "AI response" }`

- `POST /api/flows/save`
  - Body: `{ "prompt": "...", "response": "..." }`
  - Saves to MongoDB and returns saved id.

- `GET /api/health`
  - Returns `{ "ok": true }`
