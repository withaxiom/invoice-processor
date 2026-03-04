# Frontend Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the embedded HTML/CSS/JS in app.py with a React + Vite + TypeScript + Tailwind SPA. Add invoice history (localStorage), batch upload with SSE streaming, inline-editable results, and a dark/light theme toggle.

**Architecture:** React + Vite SPA in `frontend/` directory. Flask becomes a pure JSON API under `/api/`. Vite proxies `/api` to Flask in dev. Flask serves the built `frontend/dist/` in production.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS v4, Flask 3.1.3, Python 3.9

---

## Task 1: Scaffold React + Vite + TypeScript project

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.app.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/index.css`
- Create: `frontend/.gitignore`

**Step 1: Initialize Vite project**

Run:
```bash
cd frontend && npm create vite@latest . -- --template react-ts
```

If the directory already exists, confirm overwrite.

**Step 2: Install Tailwind CSS v4**

Run:
```bash
cd frontend && npm install -D tailwindcss @tailwindcss/vite
```

**Step 3: Configure Vite with Tailwind and API proxy**

Edit `frontend/vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
```

**Step 4: Set up Tailwind CSS entry point**

Replace `frontend/src/index.css` with:
```css
@import "tailwindcss";

@theme {
  --color-axiom-green: #183A2B;
  --color-axiom-navy: #08153B;
  --color-axiom-gold: #C8A165;
  --color-axiom-gold-light: #d4b175;
  --color-axiom-bg: #0B0B0B;
  --color-axiom-card: #111111;
  --color-axiom-border: #222222;
  --color-axiom-text: #E8E4DF;
  --color-axiom-muted: #7A7570;
  --color-axiom-error: #E74C3C;
}
```

**Step 5: Create minimal App.tsx**

```tsx
function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-axiom-bg text-slate-900 dark:text-axiom-text">
      <h1 className="text-2xl p-8">AXIOM Invoice Processor</h1>
    </div>
  );
}

export default App;
```

**Step 6: Verify it runs**

Run:
```bash
cd frontend && npm run dev
```

Expected: Vite dev server at http://localhost:3000, page shows "AXIOM Invoice Processor"

**Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold React + Vite + TypeScript + Tailwind frontend"
```

---

## Task 2: Refactor Flask API — move routes to /api/ prefix and serve SPA

**Files:**
- Modify: `app.py:16-17` (imports)
- Modify: `app.py:155-454` (remove HTML_TEMPLATE)
- Modify: `app.py:450-454` (index route)
- Modify: `app.py:457` (extract route path)
- Modify: `.gitignore` (add frontend/dist, node_modules)

**Step 1: Remove HTML template and update imports**

In `app.py`, remove `render_template_string` from the Flask import. Remove the entire `HTML_TEMPLATE` string (lines 155-447). Update the Flask import to include `send_from_directory`.

Updated imports:
```python
from flask import Flask, request, jsonify, send_file, send_from_directory, Response
```

**Step 2: Update route paths**

Change `@app.route("/extract", ...)` to `@app.route("/api/extract", ...)`.

**Step 3: Add SPA serving for production**

Replace the index route with:
```python
# ─── SPA Serving ────────────────────────────────────────────────────────────

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend", "dist")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    """Serve React SPA — static files or index.html for client-side routing."""
    if path and os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, "index.html")
```

**Step 4: Add batch SSE endpoint**

Add after the `/api/extract` route:
```python
@app.route("/api/extract/batch", methods=["POST"])
def extract_batch():
    """Process multiple PDFs and stream results via SSE."""
    files = request.files.getlist("files")
    if not files:
        return jsonify({"error": "No files uploaded"}), 400

    def generate():
        total = len(files)
        for idx, file in enumerate(files):
            if not file.filename.lower().endswith(".pdf"):
                yield f"data: {json.dumps({'index': idx, 'filename': file.filename, 'error': 'Not a PDF file'})}\n\n"
                continue

            pdf_path = os.path.join(UPLOAD_DIR, file.filename)
            file.save(pdf_path)
            try:
                text = extract_text_from_pdf(pdf_path)
                if not text.strip():
                    yield f"data: {json.dumps({'index': idx, 'filename': file.filename, 'error': 'Could not extract text from PDF'})}\n\n"
                    continue

                invoice = extract_invoice_data(text)
                csv_str = invoice_to_csv(invoice)
                yield f"data: {json.dumps({'index': idx, 'filename': file.filename, 'invoice': invoice, 'csv': csv_str, 'total': total})}\n\n"

            except json.JSONDecodeError:
                yield f"data: {json.dumps({'index': idx, 'filename': file.filename, 'error': 'Claude returned invalid JSON'})}\n\n"
            except anthropic.APIError as e:
                yield f"data: {json.dumps({'index': idx, 'filename': file.filename, 'error': f'API error: {str(e)}'})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'index': idx, 'filename': file.filename, 'error': f'Processing failed: {str(e)}'})}\n\n"
            finally:
                if os.path.exists(pdf_path):
                    os.remove(pdf_path)

        yield "data: {\"done\": true}\n\n"

    return Response(generate(), mimetype="text/event-stream")
```

**Step 5: Update .gitignore**

Add to `.gitignore`:
```
# Frontend
frontend/node_modules/
frontend/dist/
```

**Step 6: Test API still works**

Run:
```bash
cd /Users/carolinagomez/.openclaw/workspace/shared/AXIOM/demos/invoice-processor && python -c "from app import app; client = app.test_client(); print(client.get('/api/extract').status_code)"
```

Expected: 405 (Method Not Allowed — GET on a POST-only route), confirming the route exists.

**Step 7: Commit**

```bash
git add app.py .gitignore
git commit -m "refactor: convert Flask to JSON API with /api/ prefix, add batch SSE endpoint, remove embedded HTML"
```

---

## Task 3: TypeScript types and API client

**Files:**
- Create: `frontend/src/types/invoice.ts`
- Create: `frontend/src/api/invoices.ts`

**Step 1: Define invoice types**

Create `frontend/src/types/invoice.ts`:
```ts
export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  vendor_name: string;
  vendor_address: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  bill_to: string | null;
  line_items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  payment_terms: string | null;
  notes: string | null;
  _warnings?: string[];
  _extracted_at?: string;
}

export interface ExtractResponse {
  invoice: Invoice;
  csv: string;
  error?: string;
}

export interface BatchEvent {
  index: number;
  filename: string;
  invoice?: Invoice;
  csv?: string;
  error?: string;
  total?: number;
  done?: boolean;
}

export interface StoredInvoice {
  id: string;
  filename: string;
  invoice: Invoice;
  csv: string;
  processedAt: string;
}
```

**Step 2: Create API client**

Create `frontend/src/api/invoices.ts`:
```ts
import type { ExtractResponse, BatchEvent } from "../types/invoice";

export async function extractInvoice(file: File): Promise<ExtractResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/extract", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function extractBatch(
  files: File[],
  onEvent: (event: BatchEvent) => void
): Promise<void> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const res = await fetch("/api/extract/batch", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Batch request failed");

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const event: BatchEvent = JSON.parse(line.slice(6));
        onEvent(event);
        if (event.done) return;
      }
    }
  }
}
```

**Step 3: Verify TypeScript compiles**

Run:
```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/types/ frontend/src/api/
git commit -m "feat: add TypeScript types and API client for invoice extraction"
```

---

## Task 4: Theme system (useTheme hook + ThemeToggle component)

**Files:**
- Create: `frontend/src/hooks/useTheme.ts`
- Create: `frontend/src/components/ThemeToggle.tsx`

**Step 1: Create useTheme hook**

Create `frontend/src/hooks/useTheme.ts`:
```ts
import { useState, useEffect } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("axiom-theme") as Theme | null;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("axiom-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggle };
}
```

**Step 2: Create ThemeToggle component**

Create `frontend/src/components/ThemeToggle.tsx`:
```tsx
interface ThemeToggleProps {
  theme: "light" | "dark";
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-lg border border-slate-200 dark:border-axiom-border hover:border-axiom-gold transition-colors"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <svg className="w-5 h-5 text-axiom-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}
```

**Step 3: Verify it compiles**

Run:
```bash
cd frontend && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add frontend/src/hooks/useTheme.ts frontend/src/components/ThemeToggle.tsx
git commit -m "feat: add dark/light theme system with toggle and localStorage persistence"
```

---

## Task 5: Layout shell component

**Files:**
- Create: `frontend/src/components/Layout.tsx`

**Step 1: Create Layout component**

Create `frontend/src/components/Layout.tsx`:
```tsx
import { type ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";
import type { StoredInvoice } from "../types/invoice";

interface LayoutProps {
  theme: "light" | "dark";
  onThemeToggle: () => void;
  history: StoredInvoice[];
  selectedId: string | null;
  onSelectInvoice: (id: string) => void;
  children: ReactNode;
}

export function Layout({
  theme,
  onThemeToggle,
  history,
  selectedId,
  onSelectInvoice,
  children,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-axiom-bg text-slate-900 dark:text-axiom-text">
      {/* Header */}
      <header className="bg-gradient-to-r from-axiom-green to-axiom-navy border-b-[3px] border-axiom-gold px-6 py-5 md:px-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-[6px] text-axiom-gold uppercase font-serif">
              AXIOM Collective
            </p>
            <h1 className="text-2xl font-serif text-white mt-1">Invoice Processor</h1>
            <p className="text-white/45 text-sm">
              Upload a PDF invoice. Get structured data in seconds.
            </p>
          </div>
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-100px)] border-r border-slate-200 dark:border-axiom-border bg-white dark:bg-axiom-card p-4 hidden md:block">
          <h2 className="text-xs uppercase tracking-wider text-slate-500 dark:text-axiom-muted font-semibold mb-3">
            History
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-axiom-muted">No invoices yet</p>
          ) : (
            <ul className="space-y-1">
              {history.map((inv) => (
                <li key={inv.id}>
                  <button
                    onClick={() => onSelectInvoice(inv.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedId === inv.id
                        ? "bg-axiom-gold/10 text-axiom-gold border border-axiom-gold/30"
                        : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-axiom-text"
                    }`}
                  >
                    <div className="font-medium truncate">
                      {inv.invoice.invoice_number || inv.filename}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-axiom-muted mt-0.5">
                      {inv.invoice.vendor_name || "Unknown vendor"}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 md:p-10 max-w-4xl">
          {children}
        </main>
      </div>

      <footer className="border-t border-slate-200 dark:border-axiom-border p-5 text-center text-xs text-slate-400 dark:text-axiom-muted">
        AXIOM Collective &middot; Invoice Processor Demo &middot; Module 3 Proof of Competence
      </footer>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run:
```bash
cd frontend && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "feat: add Layout shell with header, sidebar, and footer"
```

---

## Task 6: UploadZone component (single + batch)

**Files:**
- Create: `frontend/src/components/UploadZone.tsx`

**Step 1: Create UploadZone component**

Create `frontend/src/components/UploadZone.tsx`:
```tsx
import { useState, useRef, type DragEvent } from "react";

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadZone({ onFiles, disabled }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrag(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf"
    );
    if (files.length > 0) onFiles(files);
  }

  function handleChange() {
    const files = Array.from(inputRef.current?.files || []);
    if (files.length > 0) onFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div
      onDragEnter={(e) => { handleDrag(e); setDragOver(true); }}
      onDragOver={(e) => { handleDrag(e); setDragOver(true); }}
      onDragLeave={(e) => { handleDrag(e); setDragOver(false); }}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${dragOver
          ? "border-axiom-gold bg-axiom-gold/5"
          : "border-slate-300 dark:border-axiom-border bg-white dark:bg-axiom-card hover:border-axiom-gold hover:bg-axiom-gold/[0.02]"
        }`}
    >
      <div className="text-5xl mb-4 opacity-60">&#128196;</div>
      <h2 className="text-xl font-serif text-slate-800 dark:text-white mb-2">
        Drop your invoices here
      </h2>
      <p className="text-sm text-slate-500 dark:text-axiom-muted">
        or click to browse &mdash; PDF files up to 16MB &mdash; multiple files supported
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run:
```bash
cd frontend && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add frontend/src/components/UploadZone.tsx
git commit -m "feat: add UploadZone with drag-and-drop and multi-file support"
```

---

## Task 7: ProcessingState and WarningBanner components

**Files:**
- Create: `frontend/src/components/ProcessingState.tsx`
- Create: `frontend/src/components/WarningBanner.tsx`

**Step 1: Create ProcessingState**

Create `frontend/src/components/ProcessingState.tsx`:
```tsx
interface ProcessingStateProps {
  message?: string;
  progress?: { current: number; total: number };
}

export function ProcessingState({ message, progress }: ProcessingStateProps) {
  return (
    <div className="text-center py-16">
      <div className="w-12 h-12 border-[3px] border-slate-200 dark:border-axiom-border border-t-axiom-gold rounded-full animate-spin mx-auto mb-5" />
      <p className="text-slate-600 dark:text-axiom-muted text-sm">
        {message || "Extracting invoice data with Claude..."}
      </p>
      {progress && (
        <div className="mt-4 max-w-xs mx-auto">
          <div className="h-2 bg-slate-200 dark:bg-axiom-border rounded-full overflow-hidden">
            <div
              className="h-full bg-axiom-gold rounded-full transition-all duration-500"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-axiom-muted mt-2">
            {progress.current} of {progress.total} invoices processed
          </p>
        </div>
      )}
      <p className="text-xs text-slate-400 dark:text-axiom-muted mt-2">
        This usually takes 5–15 seconds per invoice
      </p>
    </div>
  );
}
```

**Step 2: Create WarningBanner**

Create `frontend/src/components/WarningBanner.tsx`:
```tsx
interface WarningBannerProps {
  warnings: string[];
}

export function WarningBanner({ warnings }: WarningBannerProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="bg-red-50 dark:bg-axiom-error/[0.06] border border-red-200 dark:border-axiom-error/15 border-l-4 border-l-axiom-error rounded-r-lg p-3 mb-4">
      {warnings.map((w, i) => (
        <p key={i} className="text-sm text-axiom-error">
          &#9888; {w}
        </p>
      ))}
    </div>
  );
}
```

**Step 3: Verify and commit**

Run:
```bash
cd frontend && npx tsc --noEmit
```

```bash
git add frontend/src/components/ProcessingState.tsx frontend/src/components/WarningBanner.tsx
git commit -m "feat: add ProcessingState and WarningBanner components"
```

---

## Task 8: InvoiceSummary component (editable fields)

**Files:**
- Create: `frontend/src/components/InvoiceSummary.tsx`

**Step 1: Create InvoiceSummary with inline editing**

Create `frontend/src/components/InvoiceSummary.tsx`:
```tsx
import { useState } from "react";
import type { Invoice } from "../types/invoice";

interface InvoiceSummaryProps {
  invoice: Invoice;
  onUpdate: (invoice: Invoice) => void;
}

function EditableField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    setEditing(false);
    if (draft !== value) onSave(draft);
  }

  return (
    <div className="bg-white dark:bg-axiom-card border border-slate-200 dark:border-axiom-border rounded-xl p-4">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-axiom-muted mb-1">
        {label}
      </div>
      {editing ? (
        <input
          className="w-full text-[15px] font-semibold bg-transparent border-b border-axiom-gold outline-none text-slate-800 dark:text-white"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
        />
      ) : (
        <div
          className="text-[15px] font-semibold text-slate-800 dark:text-white cursor-pointer hover:text-axiom-gold transition-colors"
          onClick={() => { setDraft(value); setEditing(true); }}
          title="Click to edit"
        >
          {value || "N/A"}
        </div>
      )}
    </div>
  );
}

export function InvoiceSummary({ invoice, onUpdate }: InvoiceSummaryProps) {
  function update(field: keyof Invoice, val: string) {
    onUpdate({ ...invoice, [field]: val });
  }

  const cards: { label: string; field: keyof Invoice; format?: (v: unknown) => string }[] = [
    { label: "Vendor", field: "vendor_name" },
    { label: "Invoice #", field: "invoice_number" },
    { label: "Date", field: "invoice_date" },
    { label: "Due Date", field: "due_date" },
    {
      label: "Total",
      field: "total",
      format: (v) => (v != null ? `$${Number(v).toFixed(2)}` : "N/A"),
    },
    { label: "Currency", field: "currency" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
      {cards.map((c) => (
        <EditableField
          key={c.field}
          label={c.label}
          value={
            c.format
              ? c.format(invoice[c.field])
              : String(invoice[c.field] ?? "N/A")
          }
          onSave={(val) => update(c.field, val)}
        />
      ))}
    </div>
  );
}
```

**Step 2: Verify and commit**

```bash
cd frontend && npx tsc --noEmit
```

```bash
git add frontend/src/components/InvoiceSummary.tsx
git commit -m "feat: add InvoiceSummary with inline-editable fields"
```

---

## Task 9: LineItemsTable component (editable cells)

**Files:**
- Create: `frontend/src/components/LineItemsTable.tsx`

**Step 1: Create LineItemsTable with editable cells**

Create `frontend/src/components/LineItemsTable.tsx`:
```tsx
import { useState } from "react";
import type { Invoice, LineItem } from "../types/invoice";

interface LineItemsTableProps {
  invoice: Invoice;
  onUpdate: (invoice: Invoice) => void;
}

function EditableCell({
  value,
  align,
  onSave,
}: {
  value: string;
  align?: "right";
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    setEditing(false);
    if (draft !== value) onSave(draft);
  }

  if (editing) {
    return (
      <td className={`px-4 py-2.5 border-b border-slate-100 dark:border-axiom-border ${align === "right" ? "text-right" : ""}`}>
        <input
          className="w-full bg-transparent border-b border-axiom-gold outline-none text-sm text-slate-800 dark:text-white"
          style={{ textAlign: align || "left" }}
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
        />
      </td>
    );
  }

  return (
    <td
      className={`px-4 py-2.5 border-b border-slate-100 dark:border-axiom-border text-sm cursor-pointer hover:text-axiom-gold transition-colors ${align === "right" ? "text-right" : ""}`}
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value}
    </td>
  );
}

export function LineItemsTable({ invoice, onUpdate }: LineItemsTableProps) {
  function updateItem(idx: number, field: keyof LineItem, raw: string) {
    const items = [...invoice.line_items];
    const numericFields: (keyof LineItem)[] = ["quantity", "unit_price", "total"];
    if (numericFields.includes(field)) {
      (items[idx] as Record<string, unknown>)[field] = parseFloat(raw) || 0;
    } else {
      (items[idx] as Record<string, unknown>)[field] = raw;
    }
    onUpdate({ ...invoice, line_items: items });
  }

  const fmt = (n: number | null | undefined) =>
    n != null ? `$${Number(n).toFixed(2)}` : "";

  return (
    <div className="border border-slate-200 dark:border-axiom-border rounded-xl overflow-hidden mb-6">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-axiom-green text-white">
            <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wider">Description</th>
            <th className="px-4 py-2.5 text-right text-[11px] uppercase tracking-wider">Qty</th>
            <th className="px-4 py-2.5 text-right text-[11px] uppercase tracking-wider">Unit Price</th>
            <th className="px-4 py-2.5 text-right text-[11px] uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-axiom-card">
          {invoice.line_items.map((item, i) => (
            <tr key={i}>
              <EditableCell value={item.description || ""} onSave={(v) => updateItem(i, "description", v)} />
              <EditableCell value={String(item.quantity ?? "")} align="right" onSave={(v) => updateItem(i, "quantity", v)} />
              <EditableCell value={fmt(item.unit_price)} align="right" onSave={(v) => updateItem(i, "unit_price", v.replace("$", ""))} />
              <EditableCell value={fmt(item.total)} align="right" onSave={(v) => updateItem(i, "total", v.replace("$", ""))} />
            </tr>
          ))}
          {/* Totals */}
          <tr className="bg-axiom-gold/[0.06]">
            <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-axiom-gold">Subtotal</td>
            <td className="px-4 py-2.5 text-right text-sm font-semibold text-axiom-gold">{fmt(invoice.subtotal)}</td>
          </tr>
          <tr className="bg-axiom-gold/[0.06]">
            <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-axiom-gold">Tax</td>
            <td className="px-4 py-2.5 text-right text-sm font-semibold text-axiom-gold">{fmt(invoice.tax)}</td>
          </tr>
          <tr className="bg-axiom-gold/[0.06]">
            <td colSpan={3} className="px-4 py-2.5 text-[15px] font-bold text-slate-800 dark:text-white">Total</td>
            <td className="px-4 py-2.5 text-right text-[15px] font-bold text-slate-800 dark:text-white">{fmt(invoice.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

**Step 2: Verify and commit**

```bash
cd frontend && npx tsc --noEmit
```

```bash
git add frontend/src/components/LineItemsTable.tsx
git commit -m "feat: add LineItemsTable with inline-editable cells"
```

---

## Task 10: ExportActions component

**Files:**
- Create: `frontend/src/components/ExportActions.tsx`

**Step 1: Create ExportActions**

Create `frontend/src/components/ExportActions.tsx`:
```tsx
import type { Invoice } from "../types/invoice";

interface ExportActionsProps {
  invoice: Invoice;
  csv: string;
  onReset: () => void;
}

export function ExportActions({ invoice, csv, onReset }: ExportActionsProps) {
  const [showJson, setShowJson] = useState(false);

  function downloadCSV() {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `axiom_extracted_${invoice.invoice_number || "invoice"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cleanJson = Object.fromEntries(
    Object.entries(invoice).filter(([k]) => !k.startsWith("_"))
  );

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={downloadCSV}
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-axiom-gold text-black hover:bg-axiom-gold-light transition-colors"
        >
          Download CSV
        </button>
        <button
          onClick={() => setShowJson(!showJson)}
          className="px-5 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-axiom-border text-slate-700 dark:text-axiom-text hover:border-axiom-gold hover:text-axiom-gold transition-colors"
        >
          {showJson ? "Hide JSON" : "View JSON"}
        </button>
        <button
          onClick={onReset}
          className="px-5 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-axiom-border text-slate-700 dark:text-axiom-text hover:border-axiom-gold hover:text-axiom-gold transition-colors"
        >
          New Invoice
        </button>
      </div>

      {showJson && (
        <pre className="mt-4 bg-slate-50 dark:bg-[#0D0D0D] border border-slate-200 dark:border-axiom-border rounded-xl p-4 overflow-x-auto text-xs leading-relaxed font-mono max-h-[500px] overflow-y-auto">
          {JSON.stringify(cleanJson, null, 2)}
        </pre>
      )}
    </div>
  );
}
```

Note: Add `import { useState } from "react";` at the top.

**Step 2: Verify and commit**

```bash
cd frontend && npx tsc --noEmit
```

```bash
git add frontend/src/components/ExportActions.tsx
git commit -m "feat: add ExportActions with CSV download and JSON viewer"
```

---

## Task 11: useInvoices hook (state management + localStorage history)

**Files:**
- Create: `frontend/src/hooks/useInvoices.ts`

**Step 1: Create useInvoices hook**

Create `frontend/src/hooks/useInvoices.ts`:
```ts
import { useState, useCallback } from "react";
import type { Invoice, StoredInvoice, BatchEvent } from "../types/invoice";
import { extractInvoice, extractBatch } from "../api/invoices";

const STORAGE_KEY = "axiom-invoice-history";

function loadHistory(): StoredInvoice[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(history: StoredInvoice[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

type Status = "idle" | "processing" | "done" | "error";

export function useInvoices() {
  const [history, setHistory] = useState<StoredInvoice[]>(loadHistory);
  const [current, setCurrent] = useState<StoredInvoice | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  const addToHistory = useCallback((entry: StoredInvoice) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 50); // keep last 50
      saveHistory(next);
      return next;
    });
  }, []);

  const processFiles = useCallback(async (files: File[]) => {
    setStatus("processing");
    setError(null);
    setBatchProgress(null);

    try {
      if (files.length === 1) {
        // Single file
        const result = await extractInvoice(files[0]);
        const entry: StoredInvoice = {
          id: crypto.randomUUID(),
          filename: files[0].name,
          invoice: result.invoice,
          csv: result.csv,
          processedAt: new Date().toISOString(),
        };
        setCurrent(entry);
        addToHistory(entry);
        setStatus("done");
      } else {
        // Batch
        setBatchProgress({ current: 0, total: files.length });
        const results: StoredInvoice[] = [];

        await extractBatch(files, (event: BatchEvent) => {
          if (event.done) return;

          if (event.invoice && event.csv) {
            const entry: StoredInvoice = {
              id: crypto.randomUUID(),
              filename: event.filename,
              invoice: event.invoice,
              csv: event.csv,
              processedAt: new Date().toISOString(),
            };
            results.push(entry);
            addToHistory(entry);
          }

          setBatchProgress((prev) => ({
            current: (prev?.current || 0) + 1,
            total: event.total || files.length,
          }));
        });

        if (results.length > 0) {
          setCurrent(results[0]);
        }
        setStatus("done");
        setBatchProgress(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed");
      setStatus("error");
    }
  }, [addToHistory]);

  const selectInvoice = useCallback((id: string) => {
    const found = history.find((h) => h.id === id);
    if (found) {
      setCurrent(found);
      setStatus("done");
      setError(null);
    }
  }, [history]);

  const updateCurrentInvoice = useCallback((invoice: Invoice) => {
    if (!current) return;
    const updated = { ...current, invoice };
    setCurrent(updated);
    // Also update in history
    setHistory((prev) => {
      const next = prev.map((h) => (h.id === updated.id ? updated : h));
      saveHistory(next);
      return next;
    });
  }, [current]);

  const reset = useCallback(() => {
    setCurrent(null);
    setStatus("idle");
    setError(null);
    setBatchProgress(null);
  }, []);

  return {
    history,
    current,
    status,
    error,
    batchProgress,
    processFiles,
    selectInvoice,
    updateCurrentInvoice,
    reset,
  };
}
```

**Step 2: Verify and commit**

```bash
cd frontend && npx tsc --noEmit
```

```bash
git add frontend/src/hooks/useInvoices.ts
git commit -m "feat: add useInvoices hook with state management and localStorage history"
```

---

## Task 12: Wire everything together in App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

**Step 1: Assemble all components in App.tsx**

Replace `frontend/src/App.tsx`:
```tsx
import { useTheme } from "./hooks/useTheme";
import { useInvoices } from "./hooks/useInvoices";
import { Layout } from "./components/Layout";
import { UploadZone } from "./components/UploadZone";
import { ProcessingState } from "./components/ProcessingState";
import { InvoiceSummary } from "./components/InvoiceSummary";
import { LineItemsTable } from "./components/LineItemsTable";
import { ExportActions } from "./components/ExportActions";
import { WarningBanner } from "./components/WarningBanner";

function App() {
  const { theme, toggle } = useTheme();
  const {
    history,
    current,
    status,
    error,
    batchProgress,
    processFiles,
    selectInvoice,
    updateCurrentInvoice,
    reset,
  } = useInvoices();

  return (
    <Layout
      theme={theme}
      onThemeToggle={toggle}
      history={history}
      selectedId={current?.id || null}
      onSelectInvoice={selectInvoice}
    >
      {status === "idle" && (
        <UploadZone onFiles={processFiles} />
      )}

      {status === "processing" && (
        <ProcessingState
          progress={batchProgress || undefined}
        />
      )}

      {status === "error" && (
        <div className="text-center py-16">
          <p className="text-axiom-error text-sm mb-4">{error}</p>
          <button
            onClick={reset}
            className="px-5 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-axiom-border text-slate-700 dark:text-axiom-text hover:border-axiom-gold hover:text-axiom-gold transition-colors"
          >
            Try another invoice
          </button>
        </div>
      )}

      {status === "done" && current && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif text-slate-800 dark:text-white">
              Extracted Data
            </h2>
          </div>

          <InvoiceSummary
            invoice={current.invoice}
            onUpdate={updateCurrentInvoice}
          />

          <WarningBanner warnings={current.invoice._warnings || []} />

          <LineItemsTable
            invoice={current.invoice}
            onUpdate={updateCurrentInvoice}
          />

          <ExportActions
            invoice={current.invoice}
            csv={current.csv}
            onReset={reset}
          />
        </div>
      )}
    </Layout>
  );
}

export default App;
```

**Step 2: Verify it compiles and renders**

```bash
cd frontend && npx tsc --noEmit && npm run dev
```

Open http://localhost:3000 — should show the full layout with upload zone.

**Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: wire up all components in App.tsx"
```

---

## Task 13: Add Google Fonts and final CSS polish

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/src/index.css`

**Step 1: Add font imports to index.html**

Add to `<head>` in `frontend/index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Step 2: Add base font styling to index.css**

Append to `frontend/src/index.css`:
```css
body {
  font-family: "Inter", sans-serif;
}

.font-serif {
  font-family: "Playfair Display", serif;
}

.font-mono {
  font-family: "JetBrains Mono", monospace;
}
```

**Step 3: Commit**

```bash
git add frontend/index.html frontend/src/index.css
git commit -m "feat: add Google Fonts and final CSS polish"
```

---

## Task 14: Production build and Flask integration test

**Files:**
- None new — testing existing setup

**Step 1: Build the frontend**

Run:
```bash
cd frontend && npm run build
```

Expected: `frontend/dist/` created with `index.html` and assets.

**Step 2: Test Flask serves the SPA**

Run Flask:
```bash
cd /Users/carolinagomez/.openclaw/workspace/shared/AXIOM/demos/invoice-processor && python app.py &
```

Visit http://localhost:5001 — should serve the React app.

**Step 3: Test the extract endpoint still works**

```bash
curl -X POST http://localhost:5001/api/extract -F "file=@test_invoices/invoice_tech_consulting.pdf" | head -c 200
```

Expected: JSON response with invoice data.

**Step 4: Commit any fixes, then final commit**

```bash
git add -A && git commit -m "feat: complete frontend redesign — React + Vite SPA with all features"
```

---

## Summary of Tasks

| # | Task | Key Deliverable |
|---|------|----------------|
| 1 | Scaffold frontend | React + Vite + TS + Tailwind in `frontend/` |
| 2 | Refactor Flask API | `/api/` prefix, batch SSE, remove HTML template |
| 3 | Types + API client | TypeScript interfaces, fetch wrappers |
| 4 | Theme system | useTheme hook + ThemeToggle component |
| 5 | Layout shell | Header, sidebar, footer |
| 6 | UploadZone | Drag-and-drop, multi-file |
| 7 | Processing + Warnings | Spinner, progress bar, warning banner |
| 8 | InvoiceSummary | Editable summary cards |
| 9 | LineItemsTable | Editable cells |
| 10 | ExportActions | CSV download, JSON viewer |
| 11 | useInvoices hook | State management, localStorage history |
| 12 | Wire up App.tsx | Assemble all components |
| 13 | Fonts + CSS | Google Fonts, final polish |
| 14 | Build + integration test | Production build, Flask serves SPA |
