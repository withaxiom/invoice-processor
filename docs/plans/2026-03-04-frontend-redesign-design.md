# AXIOM Invoice Processor — Frontend Redesign Design

**Date:** 2026-03-04
**Status:** Approved

## Goal

Replace the embedded HTML/CSS/JS in `app.py` with a proper React + Vite SPA. Add invoice history, batch upload with SSE streaming, editable results, and a dark/light theme toggle — all while keeping AXIOM branding.

## Architecture

React + Vite SPA with Flask as a JSON API, single project. Vite proxies to Flask in dev. Flask serves the built frontend in production.

### Project Structure

```
invoice-processor/
├── app.py                      # Flask API (no embedded HTML)
├── requirements.txt
├── generate_test_invoices.py
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── api/
│       │   └── invoices.ts
│       ├── components/
│       │   ├── Layout.tsx
│       │   ├── ThemeToggle.tsx
│       │   ├── UploadZone.tsx
│       │   ├── ProcessingState.tsx
│       │   ├── InvoiceSummary.tsx
│       │   ├── LineItemsTable.tsx
│       │   ├── InvoiceHistory.tsx
│       │   ├── BatchUpload.tsx
│       │   ├── ExportActions.tsx
│       │   └── WarningBanner.tsx
│       ├── hooks/
│       │   ├── useInvoices.ts
│       │   └── useTheme.ts
│       └── types/
│           └── invoice.ts
└── dist/                       # Built frontend (gitignored)
```

## API Design

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /` | GET | Serve React SPA (production) |
| `POST /api/extract` | POST | Process single PDF, return invoice JSON + CSV |
| `POST /api/extract/batch` | POST | Accept multiple PDFs, return SSE stream of results |

### Batch SSE Flow

1. Client sends `POST /api/extract/batch` with multiple PDFs as FormData
2. Server processes each PDF sequentially
3. For each completed invoice, server sends an SSE event with the result JSON
4. Client reads the stream, updates UI in real-time (progress bar, results list)

## UI Layout

Single-page layout with collapsible sidebar:

- **Sidebar:** Invoice history list (stored in localStorage)
- **Main area:** Upload zone → Processing state → Results view
- **Header:** AXIOM branding + theme toggle

### States

1. **Empty** — Upload zone centered, sidebar shows "No invoices yet"
2. **Processing** — Animated progress, upload disabled
3. **Results** — Summary cards + editable line items table + export buttons
4. **Batch mode** — Real-time progress ("2/5 complete") with results appearing as they finish
5. **Error** — Inline error with retry

### Editable Fields

All extracted data is editable inline (summary fields and line item cells). Edits are local-only (no round-trip). Exports reflect edited values.

## Theme System

- Tailwind `darkMode: 'class'` strategy
- CSS variables at `:root` (light) and `.dark` (dark)
- `useTheme` hook: persists to localStorage, respects `prefers-color-scheme` on first visit
- Light: white bg, slate text, green-600 primary, gold-500 secondary
- Dark: #0B0B0B bg, light text, green-400 primary, gold-400 secondary

## Data Persistence

- **Invoice history:** localStorage (no backend DB)
- **Theme preference:** localStorage
- Per-browser, suitable for a demo

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Flask 3.1.3, Python 3.9
- **AI:** Claude Sonnet 4.6 via Anthropic SDK
- **PDF:** pdfplumber + pdfminer.six

## Non-Goals

- User authentication
- Backend database / persistent storage
- Deployment configuration
- Mobile-specific responsive design (desktop-first, but usable on tablets)
