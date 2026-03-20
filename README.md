# AXIOM Invoice Processor

**AI-powered invoice data extraction.** Upload a PDF invoice, get structured data in seconds.

[Live Demo](https://axiom-invoice-processor.onrender.com) &nbsp;|&nbsp; Built by [AXIOM Collective](https://withaxiom.co)

---

## How It Works

1. **Upload** a PDF invoice (drag & drop, or click to browse)
2. **AI extracts** all key fields: vendor, dates, line items, totals, payment terms
3. **Review & edit** the extracted data inline — click any field to fix it
4. **Export** as CSV or JSON, or copy to clipboard

No API key? Try the **demo mode** — works instantly with sample data.

## Screenshots

| Upload | Extracted Data | Dark Mode |
|--------|---------------|-----------|
| ![Upload view](docs/screenshots/upload.png) | ![Results view](docs/screenshots/results.png) | ![Dark mode](docs/screenshots/dark-mode.png) |

> To generate screenshots, run the app locally and capture the upload, results, and dark mode views.

## Features

- **Demo mode** — try it instantly without an API key
- **Single & batch processing** — upload one invoice or many at once
- **Inline editing** — click any extracted field to correct it before exporting
- **Validation** — checks line items sum to subtotal, and subtotal + tax = total
- **CSV & JSON export** — download files or copy JSON to clipboard
- **Dark mode** — toggle between light and dark themes (respects system preference)
- **Mobile responsive** — full functionality on any screen size
- **Rate limiting** — 10 requests/hour per IP to prevent API abuse
- **Bilingual** — processes invoices in English and Spanish

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI | [Claude API](https://docs.anthropic.com/en/docs) (Sonnet) via Anthropic Python SDK |
| Backend | Python 3.11, Flask, pdfplumber |
| Frontend | React 19, TypeScript, Tailwind CSS v4, Vite |
| Hosting | [Render](https://render.com) (free tier) |

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- [Anthropic API key](https://console.anthropic.com/settings/keys) (optional — demo mode works without one)

### 1. Clone & install

```bash
git clone https://github.com/your-org/invoice-processor.git
cd invoice-processor

# Backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
cd ..
```

### 2. Set your API key (optional)

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Skip this step to use demo mode only.

### 3. Run

```bash
# Terminal 1 — backend
python app.py
# → http://localhost:5001

# Terminal 2 — frontend dev server
cd frontend && npm run dev
# → http://localhost:3000
```

### Generate test invoices

```bash
python generate_test_invoices.py
# Creates sample PDFs in test_invoices/
```

## Deploy to Render

1. Fork this repo
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your GitHub repo — Render auto-detects `render.yaml`, or set manually:
   - **Build:** `pip install -r requirements.txt && cd frontend && npm install && npm run build`
   - **Start:** `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120`
4. Add environment variable: `ANTHROPIC_API_KEY`
5. Deploy

The app serves the React frontend from `frontend/dist/` — no separate hosting needed.

## API Reference

### `POST /api/extract`

Upload a single PDF for extraction.

**Request:** `multipart/form-data` with a `file` field (PDF, max 16 MB)

**Response:**
```json
{
  "invoice": {
    "vendor_name": "Acme Corp",
    "invoice_number": "INV-001",
    "invoice_date": "2026-01-15",
    "due_date": "2026-02-15",
    "line_items": [
      { "description": "Service A", "quantity": 2, "unit_price": 50.00, "total": 100.00 }
    ],
    "subtotal": 100.00,
    "tax": 8.25,
    "total": 108.25,
    "currency": "USD"
  },
  "csv": "..."
}
```

### `POST /api/extract/batch`

Upload multiple PDFs. Results stream via Server-Sent Events (SSE).

**Request:** `multipart/form-data` with multiple `files` fields

**Response stream:**
```
data: {"index": 0, "filename": "invoice1.pdf", "invoice": {...}, "csv": "...", "total": 3}
data: {"index": 1, "filename": "invoice2.pdf", "invoice": {...}, "csv": "...", "total": 3}
data: {"done": true}
```

## Project Structure

```
invoice-processor/
  app.py                     # Flask API — PDF extraction, Claude integration
  requirements.txt           # Python dependencies
  render.yaml                # Render deployment config
  frontend/
    src/
      App.tsx                # Main app component
      data/demoInvoice.ts    # Sample data for demo mode
      api/invoices.ts        # API client (single + batch)
      components/
        Layout.tsx           # Shell: header, mobile sidebar, footer
        UploadZone.tsx       # Drag-and-drop upload + demo button
        ProcessingState.tsx  # Loading spinner + progress bar
        InvoiceSummary.tsx   # Editable header fields
        LineItemsTable.tsx   # Editable line items table
        ExportActions.tsx    # CSV/JSON download, copy, reset
        WarningBanner.tsx    # Validation warnings
        ThemeToggle.tsx      # Light/dark mode toggle
      hooks/
        useTheme.ts          # Dark mode state + persistence
        useInvoices.ts       # Invoice processing state machine
      types/
        invoice.ts           # TypeScript interfaces
```

## Rate Limiting

The API allows **10 requests per hour per IP**. The limiter is in-memory and resets on server restart. Adjust `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW` in `app.py`.

## License

MIT

---

<p align="center">
  <strong>Built with Claude API by <a href="https://withaxiom.co">AXIOM Collective</a></strong><br>
  AI automation for businesses — en ingles y en espanol
</p>
