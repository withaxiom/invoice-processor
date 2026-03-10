# AXIOM Invoice Processor

AI-powered invoice data extraction. Upload a PDF invoice, get structured data in seconds.

**Live demo:** https://axiom-invoice-processor.onrender.com

Built by [AXIOM Collective](https://withaxiom.co) — a bilingual AI automation studio (EN/ES).

---

## What It Does

1. Upload a PDF invoice (or drag & drop multiple)
2. AI extracts all key fields: vendor, dates, line items, totals, payment terms
3. Review and edit the extracted data inline
4. Export as JSON or CSV

Handles invoices, receipts, and purchase orders. Warns you if the uploaded document doesn't look like an invoice.

## Features

- **Single & batch processing** — upload one invoice or many at once
- **Inline editing** — fix any extracted field before exporting
- **Validation** — automatically checks if line items sum to subtotal, and subtotal + tax = total
- **CSV & JSON export** — download structured data in either format
- **Dark mode** — toggle between light and dark themes
- **Rate limiting** — 10 requests/hour per IP to prevent API abuse
- **Bilingual ready** — processes invoices in English and Spanish

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI | [Claude API](https://docs.anthropic.com/en/docs) (Sonnet) via Anthropic Python SDK |
| Backend | Python, Flask, pdfplumber |
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Hosting | Render (free tier) |

## Project Structure

```
invoice-processor/
  app.py                  # Flask backend — API routes, PDF extraction, Claude integration
  requirements.txt        # Python dependencies
  Procfile                # Render start command
  render.yaml             # Render deployment config
  generate_test_invoices.py  # Script to create sample PDF invoices for testing
  test_invoices/          # Sample invoice PDFs
  frontend/
    src/
      App.tsx             # Main app component
      api/invoices.ts     # API client (single + batch extraction)
      components/
        Layout.tsx        # Shell: header, sidebar (history), footer
        UploadZone.tsx    # Drag-and-drop file upload
        ProcessingState.tsx  # Loading/progress indicator
        InvoiceSummary.tsx   # Extracted header fields (editable)
        LineItemsTable.tsx   # Extracted line items (editable)
        ExportActions.tsx    # JSON/CSV download buttons
        WarningBanner.tsx    # Validation warnings display
        ThemeToggle.tsx      # Light/dark mode toggle
      hooks/
        useTheme.ts       # Dark mode state
        useInvoices.ts    # Invoice processing state machine
      types/
        invoice.ts        # TypeScript types
```

## API Endpoints

### `POST /api/extract`

Upload a single PDF invoice for extraction.

**Request:** `multipart/form-data` with a `file` field (PDF only, max 16MB)

**Response:**
```json
{
  "invoice": {
    "vendor_name": "Acme Corp",
    "invoice_number": "INV-001",
    "invoice_date": "2026-01-15",
    "due_date": "2026-02-15",
    "bill_to": "Client Name",
    "line_items": [
      {"description": "Service A", "quantity": 2, "unit_price": 50.00, "total": 100.00}
    ],
    "subtotal": 100.00,
    "tax": 8.25,
    "total": 108.25,
    "currency": "USD",
    "payment_terms": "Net 30",
    "notes": null,
    "_warnings": [],
    "_extracted_at": "2026-03-05T15:00:00Z"
  },
  "csv": "Invoice Summary\nVendor,Acme Corp\n..."
}
```

### `POST /api/extract/batch`

Upload multiple PDFs. Returns results via Server-Sent Events (SSE).

**Request:** `multipart/form-data` with multiple `files` fields

**Response:** SSE stream, one event per file:
```
data: {"index": 0, "filename": "invoice1.pdf", "invoice": {...}, "csv": "...", "total": 3}
data: {"index": 1, "filename": "invoice2.pdf", "invoice": {...}, "csv": "...", "total": 3}
data: {"done": true}
```

## Setup — Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+
- [Anthropic API key](https://console.anthropic.com/settings/keys)

### Backend

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set API key
export ANTHROPIC_API_KEY=sk-ant-...

# Run backend
python app.py
# → http://localhost:5001
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server (proxies /api to Flask backend)
npm run dev
# → http://localhost:3000
```

### Generate Test Invoices

```bash
python generate_test_invoices.py
# Creates sample PDFs in test_invoices/
```

## Setup — Deploy to Render

1. Fork or clone this repo
2. Go to [render.com](https://render.com) and create a new **Web Service**
3. Connect your GitHub repo
4. Render will auto-detect the `render.yaml` config, or set manually:
   - **Build command:** `pip install -r requirements.txt && cd frontend && npm install && npm run build`
   - **Start command:** `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120`
5. Add environment variable: `ANTHROPIC_API_KEY` = your key
6. Deploy

The app serves the React frontend from `frontend/dist/` — no separate frontend hosting needed.

## Rate Limiting

The API is rate-limited to **10 requests per hour per IP address** to prevent abuse of the Claude API. The rate limiter is in-memory and resets on server restart.

To adjust, change `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW` in `app.py`.

## License

MIT

---

Built with Claude API by **AXIOM Collective** — AI automation for businesses, en ingles y en espanol.

## How to Sell This (AXIOM Notes)

**Who it’s for:** operators who receive PDF invoices/receipts and waste time manually typing data into accounting tools.

**Core promise:** “Turn messy PDFs into clean structured data in seconds — with human review.”

**Pitch bullets:**
- Faster data entry (minutes → seconds)
- Fewer errors (line-item validation)
- Export to CSV/JSON (feeds QuickBooks/Xero/Sheets next)

**60–90s demo:** see `demos/README.md`.
