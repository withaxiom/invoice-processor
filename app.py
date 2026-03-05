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
from flask import Flask, request, jsonify, send_file, send_from_directory, Response
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max upload

UPLOAD_DIR = tempfile.mkdtemp()

# ─── Simple rate limiting (in-memory, resets on restart) ────────────────────
_rate_limit: dict[str, list[float]] = {}
RATE_LIMIT_MAX = 10  # max requests per window
RATE_LIMIT_WINDOW = 3600  # 1 hour

def check_rate_limit() -> bool:
    """Returns True if request is allowed, False if rate limited."""
    ip = request.remote_addr or "unknown"
    now = datetime.utcnow().timestamp()
    hits = _rate_limit.get(ip, [])
    hits = [t for t in hits if now - t < RATE_LIMIT_WINDOW]
    if len(hits) >= RATE_LIMIT_MAX:
        return False
    hits.append(now)
    _rate_limit[ip] = hits
    return True

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
            (item.get("total") or 0) for item in data["line_items"]
        )
        reported_subtotal = data.get("subtotal") or 0
        if reported_subtotal and abs(calculated_subtotal - reported_subtotal) > 0.02:
            warnings.append(
                f"Line items sum to ${calculated_subtotal:.2f} but subtotal is ${reported_subtotal:.2f}"
            )

    reported_total = data.get("total") or 0
    reported_subtotal = data.get("subtotal") or 0
    reported_tax = data.get("tax") or 0
    if reported_subtotal and reported_total:
        expected_total = reported_subtotal + reported_tax
        if abs(expected_total - reported_total) > 0.02:
            warnings.append(
                f"Subtotal (${reported_subtotal:.2f}) + Tax (${reported_tax:.2f}) = ${expected_total:.2f}, but total is ${reported_total:.2f}"
            )

    # Check if this looks like an actual invoice
    has_invoice_number = bool(data.get("invoice_number"))
    has_total = bool(data.get("total"))
    has_line_items = bool(data.get("line_items"))
    if not (has_invoice_number or has_total or has_line_items):
        warnings.insert(0,
            "This document doesn't appear to be an invoice. "
            "Results may be incomplete or inaccurate. "
            "For best results, upload a PDF invoice, receipt, or purchase order."
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


# ─── SPA Serving ────────────────────────────────────────────────────────────

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend", "dist")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    """Serve React SPA — static files or index.html for client-side routing."""
    if path and os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/api/extract", methods=["POST"])
def extract():
    if not check_rate_limit():
        return jsonify({"error": "Rate limit exceeded. Try again later."}), 429

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    # Save temp file
    pdf_path = os.path.join(UPLOAD_DIR, secure_filename(file.filename))
    file.save(pdf_path)

    try:
        # Extract text
        text = extract_text_from_pdf(pdf_path)
        if not text.strip():
            return jsonify({"error": "Could not extract text from PDF. It may be a scanned image — OCR not yet supported."}), 422

        # Extract structured data
        invoice = extract_invoice_data(text)

        # Generate CSV
        csv_str = invoice_to_csv(invoice)

        return jsonify({"invoice": invoice, "csv": csv_str})

    except json.JSONDecodeError:
        return jsonify({"error": "Claude returned invalid JSON. Try again or use a clearer invoice."}), 502
    except anthropic.APIError as e:
        return jsonify({"error": f"Anthropic API error: {str(e)}"}), 502
    except Exception as e:
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500
    finally:
        # Cleanup
        if os.path.exists(pdf_path):
            os.remove(pdf_path)


@app.route("/api/extract/batch", methods=["POST"])
def extract_batch():
    """Process multiple PDFs and stream results via SSE."""
    if not check_rate_limit():
        return jsonify({"error": "Rate limit exceeded. Try again later."}), 429

    files = request.files.getlist("files")
    if not files:
        return jsonify({"error": "No files uploaded"}), 400

    def generate():
        total = len(files)
        for idx, file in enumerate(files):
            if not file.filename.lower().endswith(".pdf"):
                yield f"data: {json.dumps({'index': idx, 'filename': file.filename, 'error': 'Not a PDF file', 'total': total})}\n\n"
                continue

            pdf_path = os.path.join(UPLOAD_DIR, secure_filename(file.filename))
            file.save(pdf_path)
            try:
                text = extract_text_from_pdf(pdf_path)
                if not text.strip():
                    yield f"data: {json.dumps({'index': idx, 'filename': file.filename, 'error': 'Could not extract text from PDF', 'total': total})}\n\n"
                    continue

                invoice = extract_invoice_data(text)
                csv_str = invoice_to_csv(invoice)
                yield f"data: {json.dumps({'index': idx, 'filename': file.filename, 'invoice': invoice, 'csv': csv_str, 'total': total})}\n\n"

            except json.JSONDecodeError:
                yield f"data: {json.dumps({'index': idx, 'filename': file.filename, 'error': 'Claude returned invalid JSON', 'total': total})}\n\n"
            except anthropic.APIError as e:
                yield f"data: {json.dumps({'index': idx, 'filename': file.filename, 'error': f'API error: {str(e)}', 'total': total})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'index': idx, 'filename': file.filename, 'error': f'Processing failed: {str(e)}', 'total': total})}\n\n"
            finally:
                if os.path.exists(pdf_path):
                    os.remove(pdf_path)

        yield "data: {\"done\": true}\n\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"\n  AXIOM Invoice Processor")
    print(f"  http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=True)
