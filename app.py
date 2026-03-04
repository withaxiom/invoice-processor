"""
AXIOM Invoice Processor Demo
Extracts structured data from PDF invoices using Claude API.
Module 3 — Delivery Training Proof of Competence
"""

import os
import json
import csv
import io
import tempfile
from datetime import datetime

import anthropic
import pdfplumber
from flask import Flask, request, jsonify, send_file, render_template_string

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max upload

UPLOAD_DIR = tempfile.mkdtemp()

# ─── Core extraction ────────────────────────────────────────────────────────

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF, preserving table structure."""
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            # Also try extracting tables for better structure
            tables = page.extract_tables()
            table_text = ""
            if tables:
                for table in tables:
                    for row in table:
                        cells = [str(c or "") for c in row]
                        table_text += " | ".join(cells) + "\n"
            pages.append(f"--- Page {i+1} ---\n{text}\n{table_text}")
    return "\n".join(pages)


def extract_invoice_data(text: str) -> dict:
    """Send extracted text to Claude for structured extraction."""
    client = anthropic.Anthropic()
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        messages=[{
            "role": "user",
            "content": f"""Extract structured data from this invoice text.
Return ONLY valid JSON (no markdown fences, no explanation) with this schema:
{{
  "vendor_name": "string",
  "vendor_address": "string or null",
  "invoice_number": "string",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD or null",
  "bill_to": "string or null",
  "line_items": [
    {{"description": "string", "quantity": number, "unit_price": number, "total": number}}
  ],
  "subtotal": number,
  "tax": number,
  "total": number,
  "currency": "USD or other",
  "payment_terms": "string or null",
  "notes": "string or null"
}}

Rules:
- If a field is missing, use null.
- All monetary values as numbers (no $ signs).
- If quantity or unit_price can't be determined, set quantity=1 and unit_price=total for that line item.
- For dates, use YYYY-MM-DD format. If only month/year, use first of month.

Invoice text:
{text}"""
        }]
    )

    raw = response.content[0].text.strip()
    # Handle potential markdown fences
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    data = json.loads(raw)

    # Validation
    warnings = []
    if data.get("line_items"):
        calculated_subtotal = sum(
            item.get("total", 0) for item in data["line_items"]
        )
        reported_subtotal = data.get("subtotal", 0) or 0
        if reported_subtotal and abs(calculated_subtotal - reported_subtotal) > 0.02:
            warnings.append(
                f"Line items sum to ${calculated_subtotal:.2f} but subtotal is ${reported_subtotal:.2f}"
            )

    reported_total = data.get("total", 0) or 0
    reported_subtotal = data.get("subtotal", 0) or 0
    reported_tax = data.get("tax", 0) or 0
    if reported_subtotal and reported_total:
        expected_total = reported_subtotal + reported_tax
        if abs(expected_total - reported_total) > 0.02:
            warnings.append(
                f"Subtotal (${reported_subtotal:.2f}) + Tax (${reported_tax:.2f}) = ${expected_total:.2f}, but total is ${reported_total:.2f}"
            )

    if warnings:
        data["_warnings"] = warnings
    data["_extracted_at"] = datetime.utcnow().isoformat() + "Z"

    return data


def invoice_to_csv(data: dict) -> str:
    """Convert extracted invoice data to CSV string."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Header info
    writer.writerow(["Invoice Summary"])
    writer.writerow(["Vendor", data.get("vendor_name", "")])
    writer.writerow(["Invoice #", data.get("invoice_number", "")])
    writer.writerow(["Date", data.get("invoice_date", "")])
    writer.writerow(["Due Date", data.get("due_date", "")])
    writer.writerow(["Bill To", data.get("bill_to", "")])
    writer.writerow([])

    # Line items
    writer.writerow(["Line Items"])
    writer.writerow(["Description", "Quantity", "Unit Price", "Total"])
    for item in data.get("line_items", []):
        writer.writerow([
            item.get("description", ""),
            item.get("quantity", ""),
            item.get("unit_price", ""),
            item.get("total", ""),
        ])
    writer.writerow([])

    # Totals
    writer.writerow(["Subtotal", "", "", data.get("subtotal", "")])
    writer.writerow(["Tax", "", "", data.get("tax", "")])
    writer.writerow(["Total", "", "", data.get("total", "")])

    return output.getvalue()


# ─── Web UI ─────────────────────────────────────────────────────────────────

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AXIOM Invoice Processor</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
:root {
  --green: #183A2B; --navy: #08153B; --gold: #C8A165;
  --bg: #0B0B0B; --card: #111; --border: #222;
  --text: #E8E4DF; --muted: #7A7570;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

.header {
  background: linear-gradient(160deg, var(--green), var(--navy) 60%);
  padding: 32px 48px; border-bottom: 3px solid var(--gold);
}
.brand { font-size: 11px; letter-spacing: 6px; color: var(--gold); text-transform: uppercase; font-family: 'Playfair Display', serif; }
.header h1 { font-family: 'Playfair Display', serif; font-size: 28px; color: #fff; margin: 6px 0 2px; }
.header p { color: rgba(255,255,255,0.45); font-size: 13px; }

.container { max-width: 900px; margin: 0 auto; padding: 40px 24px; }

/* Upload zone */
.drop-zone {
  border: 2px dashed var(--border); border-radius: 12px;
  padding: 60px 40px; text-align: center; cursor: pointer;
  transition: all 0.3s ease; background: var(--card);
}
.drop-zone:hover, .drop-zone.dragover {
  border-color: var(--gold); background: rgba(200,161,101,0.04);
}
.drop-zone h2 { font-family: 'Playfair Display', serif; font-size: 22px; color: #fff; margin-bottom: 8px; }
.drop-zone p { color: var(--muted); font-size: 14px; }
.drop-zone .icon { font-size: 48px; margin-bottom: 16px; opacity: 0.6; }
input[type="file"] { display: none; }

/* Processing state */
.processing { text-align: center; padding: 60px 40px; display: none; }
.spinner {
  width: 48px; height: 48px; border: 3px solid var(--border);
  border-top-color: var(--gold); border-radius: 50%;
  animation: spin 0.8s linear infinite; margin: 0 auto 20px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.processing p { color: var(--muted); font-size: 14px; }

/* Results */
.results { display: none; }
.result-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
}
.result-header h2 { font-family: 'Playfair Display', serif; font-size: 22px; color: #fff; }
.btn-group { display: flex; gap: 8px; }
.btn {
  padding: 8px 20px; border-radius: 8px; font-size: 13px;
  font-weight: 600; cursor: pointer; border: none; transition: all 0.2s;
}
.btn-gold { background: var(--gold); color: #000; }
.btn-gold:hover { background: #d4b175; }
.btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
.btn-outline:hover { border-color: var(--gold); color: var(--gold); }

.summary-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px; margin-bottom: 24px;
}
.summary-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 10px; padding: 16px;
}
.summary-card .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 4px; }
.summary-card .value { font-size: 15px; color: #fff; font-weight: 600; }

table {
  width: 100%; border-collapse: collapse; margin: 16px 0;
  background: var(--card); border-radius: 10px; overflow: hidden;
  border: 1px solid var(--border);
}
th { background: var(--green); color: #fff; padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
td { padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 13px; }
tr:last-child td { border-bottom: none; }
.text-right { text-align: right; }

.totals-row { background: rgba(200,161,101,0.06); }
.totals-row td { font-weight: 600; color: var(--gold); }
.grand-total td { font-size: 15px; color: #fff; }

.warnings {
  background: rgba(231,76,60,0.06); border: 1px solid rgba(231,76,60,0.15);
  border-left: 4px solid #E74C3C; border-radius: 0 8px 8px 0;
  padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #E74C3C;
}

.json-view {
  background: #0D0D0D; border: 1px solid var(--border); border-radius: 10px;
  padding: 16px; overflow-x: auto; font-family: 'JetBrains Mono', monospace;
  font-size: 12px; line-height: 1.6; display: none; margin-top: 16px;
  max-height: 500px; overflow-y: auto;
}

.footer { padding: 20px; border-top: 1px solid var(--border); font-size: 11px; color: var(--muted); text-align: center; margin-top: 40px; }

.error { text-align: center; padding: 40px; display: none; }
.error p { color: #E74C3C; font-size: 14px; margin-bottom: 16px; }
</style>
</head>
<body>

<div class="header">
  <div class="brand">AXIOM Collective</div>
  <h1>Invoice Processor</h1>
  <p>Upload a PDF invoice. Get structured data in seconds.</p>
</div>

<div class="container">

  <!-- Upload -->
  <div id="upload" class="drop-zone" onclick="document.getElementById('fileInput').click()">
    <div class="icon">&#128196;</div>
    <h2>Drop your invoice here</h2>
    <p>or click to browse &mdash; PDF files up to 16MB</p>
    <input type="file" id="fileInput" accept=".pdf">
  </div>

  <!-- Processing -->
  <div id="processing" class="processing">
    <div class="spinner"></div>
    <p>Extracting invoice data with Claude...</p>
    <p style="margin-top:8px;font-size:12px;color:var(--muted)">This usually takes 5-15 seconds</p>
  </div>

  <!-- Error -->
  <div id="error" class="error">
    <p id="errorMsg"></p>
    <button class="btn btn-outline" onclick="resetUI()">Try another invoice</button>
  </div>

  <!-- Results -->
  <div id="results" class="results">
    <div class="result-header">
      <h2>Extracted Data</h2>
      <div class="btn-group">
        <button class="btn btn-gold" onclick="downloadCSV()">Download CSV</button>
        <button class="btn btn-outline" onclick="toggleJSON()">View JSON</button>
        <button class="btn btn-outline" onclick="resetUI()">New Invoice</button>
      </div>
    </div>

    <div class="summary-grid" id="summaryGrid"></div>
    <div id="warningsDiv"></div>
    <table id="lineItemsTable"></table>
    <div class="json-view" id="jsonView"></div>
  </div>

</div>

<div class="footer">AXIOM Collective &middot; Invoice Processor Demo &middot; Module 3 Proof of Competence</div>

<script>
let invoiceData = null;
let csvData = null;

// Drag and drop
const dropZone = document.getElementById('upload');
const fileInput = document.getElementById('fileInput');

['dragenter', 'dragover'].forEach(evt => {
  dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.add('dragover'); });
});
['dragleave', 'drop'].forEach(evt => {
  dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.remove('dragover'); });
});
dropZone.addEventListener('drop', e => {
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') processFile(file);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) processFile(fileInput.files[0]);
});

function processFile(file) {
  document.getElementById('upload').style.display = 'none';
  document.getElementById('processing').style.display = 'block';
  document.getElementById('error').style.display = 'none';
  document.getElementById('results').style.display = 'none';

  const formData = new FormData();
  formData.append('file', file);

  fetch('/extract', { method: 'POST', body: formData })
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        showError(data.error);
        return;
      }
      invoiceData = data.invoice;
      csvData = data.csv;
      renderResults(data.invoice);
    })
    .catch(err => showError('Failed to process invoice: ' + err.message));
}

function showError(msg) {
  document.getElementById('processing').style.display = 'none';
  document.getElementById('error').style.display = 'block';
  document.getElementById('errorMsg').textContent = msg;
}

function resetUI() {
  document.getElementById('upload').style.display = 'block';
  document.getElementById('processing').style.display = 'none';
  document.getElementById('error').style.display = 'none';
  document.getElementById('results').style.display = 'none';
  document.getElementById('jsonView').style.display = 'none';
  fileInput.value = '';
}

function renderResults(inv) {
  document.getElementById('processing').style.display = 'none';
  document.getElementById('results').style.display = 'block';

  // Summary cards
  const grid = document.getElementById('summaryGrid');
  const cards = [
    { label: 'Vendor', value: inv.vendor_name || 'Unknown' },
    { label: 'Invoice #', value: inv.invoice_number || 'N/A' },
    { label: 'Date', value: inv.invoice_date || 'N/A' },
    { label: 'Due Date', value: inv.due_date || 'N/A' },
    { label: 'Total', value: inv.total != null ? '$' + Number(inv.total).toFixed(2) : 'N/A' },
    { label: 'Currency', value: inv.currency || 'USD' },
  ];
  grid.innerHTML = cards.map(c =>
    `<div class="summary-card"><div class="label">${c.label}</div><div class="value">${c.value}</div></div>`
  ).join('');

  // Warnings
  const wDiv = document.getElementById('warningsDiv');
  if (inv._warnings && inv._warnings.length) {
    wDiv.innerHTML = `<div class="warnings">${inv._warnings.map(w => '&#9888; ' + w).join('<br>')}</div>`;
  } else {
    wDiv.innerHTML = '';
  }

  // Line items table
  const table = document.getElementById('lineItemsTable');
  let html = '<tr><th>Description</th><th class="text-right">Qty</th><th class="text-right">Unit Price</th><th class="text-right">Total</th></tr>';
  (inv.line_items || []).forEach(item => {
    html += `<tr>
      <td>${item.description || ''}</td>
      <td class="text-right">${item.quantity != null ? item.quantity : ''}</td>
      <td class="text-right">${item.unit_price != null ? '$' + Number(item.unit_price).toFixed(2) : ''}</td>
      <td class="text-right">${item.total != null ? '$' + Number(item.total).toFixed(2) : ''}</td>
    </tr>`;
  });
  html += `<tr class="totals-row"><td colspan="3">Subtotal</td><td class="text-right">${inv.subtotal != null ? '$' + Number(inv.subtotal).toFixed(2) : ''}</td></tr>`;
  html += `<tr class="totals-row"><td colspan="3">Tax</td><td class="text-right">${inv.tax != null ? '$' + Number(inv.tax).toFixed(2) : ''}</td></tr>`;
  html += `<tr class="totals-row grand-total"><td colspan="3">Total</td><td class="text-right">${inv.total != null ? '$' + Number(inv.total).toFixed(2) : ''}</td></tr>`;
  table.innerHTML = html;

  // JSON view
  const cleaned = Object.fromEntries(Object.entries(inv).filter(([k]) => !k.startsWith('_')));
  document.getElementById('jsonView').textContent = JSON.stringify(cleaned, null, 2);
}

function toggleJSON() {
  const el = document.getElementById('jsonView');
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function downloadCSV() {
  if (!csvData) return;
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const name = invoiceData.invoice_number || 'invoice';
  a.download = `axiom_extracted_${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>
</body>
</html>
"""


# ─── Routes ─────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template_string(HTML_TEMPLATE)


@app.route("/extract", methods=["POST"])
def extract():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    # Save temp file
    pdf_path = os.path.join(UPLOAD_DIR, file.filename)
    file.save(pdf_path)

    try:
        # Extract text
        text = extract_text_from_pdf(pdf_path)
        if not text.strip():
            return jsonify({"error": "Could not extract text from PDF. It may be a scanned image — OCR not yet supported."})

        # Extract structured data
        invoice = extract_invoice_data(text)

        # Generate CSV
        csv_str = invoice_to_csv(invoice)

        return jsonify({"invoice": invoice, "csv": csv_str})

    except json.JSONDecodeError:
        return jsonify({"error": "Claude returned invalid JSON. Try again or use a clearer invoice."})
    except anthropic.APIError as e:
        return jsonify({"error": f"Anthropic API error: {str(e)}"})
    except Exception as e:
        return jsonify({"error": f"Processing failed: {str(e)}"})
    finally:
        # Cleanup
        if os.path.exists(pdf_path):
            os.remove(pdf_path)


if __name__ == "__main__":
    print("\n  AXIOM Invoice Processor")
    print("  http://localhost:5001\n")
    app.run(host="0.0.0.0", port=5001, debug=True)
