# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Marki16 is an invoice collection reminder (relances) application for unpaid invoices (impayés), primarily targeting the real estate sector. It manages contacts, invoice tracking, automated email reminder sequences, and syncing from an external database.

## Commands

### Lancer / arrêter les deux serveurs
```bash
./start.sh   # démarre backend (port 1555) + frontend (port 5001) en arrière-plan
./stop.sh    # arrête proprement les deux serveurs
```
Les logs sont redirigés vers `backend.log` et `frontend.log` à la racine du projet.

### Backend (Express + Parse Server)
```bash
cd backend
npm run dev    # nodemon, hot-reload, port 1555
npm start      # production, port 1555
```

### Frontend (Nuxt 3)
```bash
cd frontend
npm run dev    # nuxt dev, port 5001
npm run build  # production build
npm run preview
```

No test framework is configured yet.

## Architecture

### Backend (`backend/`)
- **`server.js`** — Express app that mounts Parse Server at `/parse`. Exposes `/healthy` for health checks.
- **`cloud/main.js`** — Parse Cloud Code entry point. All server-side business logic (cloud functions, hooks) goes here.
- **Database**: MongoDB Atlas (URI in `.env`). Parse Server wraps all DB access — use Parse SDK or Cloud Code, not Mongoose directly.
- **Port**: 1555

### Frontend (`frontend/`)
- **Nuxt 3** with file-based routing under `pages/`.
- **`app.vue`** — Root component, wraps everything in Naive UI providers (`NMessageProvider`, `NDialogProvider`, `NNotificationProvider`).
- **`plugins/parse.client.js`** — Initializes the Parse JS SDK client-side. Access Parse in components via `useNuxtApp().$parse`.
- **`plugins/naive-ui.ts`** — Naive UI plugin registration.
- **UI**: Naive UI for components, TailwindCSS for utility styling, `@heroicons/vue` for icons.
- **State management**: Pinia stores (planned: `auth.ts`, `ui.ts` for sidebar collapse).
- **Port**: 5001 (proxies `/api` to backend port 1555)

### Environment (`.env` at project root)
Key variables used by the backend:
- `MONGODB_URI` — MongoDB Atlas connection string
- `PARSE_APP_ID`, `PARSE_MASTER_KEY`, `PARSE_JAVASCRIPT_KEY`, `PARSE_SERVER_URL`
- `OLLAMA_API_URL`, `OLLAMA_MODEL` — PDF parsing via Mistral
- `FTP_HOST/USER/PASSWORD/BASE_PATH` — FTP sync for PDFs from external system
- `EXTERNAL_DB_URI` — PostgreSQL DB (Analyse immo) for contact/invoice sync
- `UPLOAD_STORAGE_PATH` — Local storage for manually uploaded PDFs

The frontend reads Parse config via `nuxt.config.ts` `runtimeConfig.public`.

## Domain Concepts

- **Impayés**: Unpaid invoices. Status: `impayé` → `en cours` → `payé`. Each has a payeur (contact), optional apporteur d'affaire, and property address.
- **Contacts**: Two sources — `db_externe` (synced from Analyse immo, read-only here) and `upload` (from PDF parsing, editable).
- **Séquences**: Named email reminder sequences. Each has ordered emails with a `J+N` delay, SMTP profile, and auto-attribution rules (e.g. `payeur_type = Propriétaire`). A sequence assigned to an impayé generates relances automatically.
- **Relances**: Individual scheduled emails. Status: `pending` → `envoyé` / `échec`. Manual relances are flagged. Changing a sequence on an impayé cancels pending relances and recreates them.
- **Sync**: Hourly cron syncs contacts/invoices from external PostgreSQL DB and PDFs from FTP. Manual import is a 3-step wizard: PDF upload → Mistral parsing → validation.

## Planned Navigation Structure

Sidebar routes (from `SCREENS.md`):
- `/` — Dashboard (KPIs, charts via `vue-chartjs`)
- `/import` — PDF upload wizard (Mistral/Ollama parsing)
- `/impayes` — Unpaid invoice list (3 views: unitaire, par payeur, par contact)
- `/impayes/[id]` — Invoice detail with sequence + relance history
- `/contacts` — Contact list
- `/contacts/sans-email` — Contacts missing email
- `/sequences` — Sequence list
- `/sequences/[id]` — Sequence editor (Toast UI Editor for email body, variable picker `[[variable]]`)
- `/relances` — Relances calendar (FullCalendar) + table view
- `/settings/smtp` — SMTP profiles
- `/settings/users` — User management (admin only, middleware `admin.ts`)

Auth via `Parse.User.logIn()`. Middleware `auth.ts` protects all routes except `/login`. Layout `auth.vue` for the login page.
