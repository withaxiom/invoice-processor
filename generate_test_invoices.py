"""Generate 5 test invoices in different formats for proof of competence."""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

OUT_DIR = os.path.join(os.path.dirname(__file__), "test_invoices")
os.makedirs(OUT_DIR, exist_ok=True)

styles = getSampleStyleSheet()
title_style = ParagraphStyle("Title2", parent=styles["Title"], fontSize=20, spaceAfter=6)
heading_style = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=12, spaceAfter=4)
normal = styles["Normal"]


def make_invoice_1():
    """Standard US invoice — tech consulting."""
    doc = SimpleDocTemplate(os.path.join(OUT_DIR, "invoice_tech_consulting.pdf"), pagesize=letter)
    story = []
    story.append(Paragraph("INVOICE", title_style))
    story.append(Spacer(1, 12))

    info = [
        ["From:", "Apex Digital Solutions LLC", "", "Invoice #:", "INV-2026-0042"],
        ["", "1200 Tech Park Drive, Suite 300", "", "Date:", "February 15, 2026"],
        ["", "Austin, TX 78701", "", "Due Date:", "March 15, 2026"],
        ["", "billing@apexdigital.io", "", "Terms:", "Net 30"],
        ["", "", "", "", ""],
        ["Bill To:", "Riverside Law Group", "", "", ""],
        ["", "450 Congress Ave, Floor 12", "", "", ""],
        ["", "Austin, TX 78701", "", "", ""],
    ]
    t = Table(info, colWidths=[60, 200, 40, 70, 140])
    t.setStyle(TableStyle([("FONTSIZE", (0, 0), (-1, -1), 9), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(t)
    story.append(Spacer(1, 20))

    items = [
        ["Description", "Hours", "Rate", "Amount"],
        ["AI Voice Agent Development — Lead Qualification System\nVapi.ai + Twilio integration, 5 qualifying questions,\nCal.com booking, HubSpot CRM webhook", "24", "$125.00", "$3,000.00"],
        ["Chatbot Implementation — Website Lead Capture\nBotpress setup, FAQ training (50 pairs),\nembedded widget, CRM integration", "12", "$125.00", "$1,500.00"],
        ["System Testing & QA\n10 test scenarios, edge case handling,\nbilingual testing (EN/ES)", "8", "$125.00", "$1,000.00"],
        ["Training & Documentation\n2x Loom videos, admin guide PDF,\ntroubleshooting reference", "4", "$125.00", "$500.00"],
    ]
    t = Table(items, colWidths=[300, 50, 70, 90])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#183A2B")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
    ]))
    story.append(t)
    story.append(Spacer(1, 12))

    totals = [
        ["", "", "Subtotal:", "$6,000.00"],
        ["", "", "Tax (8.25%):", "$495.00"],
        ["", "", "Total Due:", "$6,495.00"],
    ]
    t = Table(totals, colWidths=[300, 50, 70, 90])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("LINEABOVE", (2, 2), (-1, 2), 1, colors.black),
        ("FONTNAME", (2, 2), (-1, 2), "Helvetica-Bold"),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))
    story.append(Paragraph("Payment: Wire transfer or check payable to Apex Digital Solutions LLC", normal))
    doc.build(story)
    print("  Created: invoice_tech_consulting.pdf")


def make_invoice_2():
    """Freelancer invoice — simple format."""
    doc = SimpleDocTemplate(os.path.join(OUT_DIR, "invoice_freelancer.pdf"), pagesize=letter)
    story = []
    story.append(Paragraph("Maria Santos — Graphic Design", title_style))
    story.append(Paragraph("Invoice #MS-0087 | January 28, 2026", normal))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Bill To: AXIOM Collective / Carolina Gomez / hello@withaxiom.co", normal))
    story.append(Spacer(1, 16))

    items = [
        ["Service", "Amount"],
        ["Logo Design — AXIOM Collective (7 color variations)", "$800.00"],
        ["LinkedIn Banner Design (company page + personal)", "$250.00"],
        ["Business Card Layout (front + back)", "$150.00"],
        ["Brand Guidelines PDF (12 pages)", "$400.00"],
    ]
    t = Table(items, colWidths=[380, 100])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#08153B")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    totals = [
        ["", "Subtotal: $1,600.00"],
        ["", "Tax: $0.00"],
        ["", "Total: $1,600.00"],
    ]
    t = Table(totals, colWidths=[380, 100])
    t.setStyle(TableStyle([
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (1, 2), (1, 2), "Helvetica-Bold"),
    ]))
    story.append(t)
    story.append(Spacer(1, 16))
    story.append(Paragraph("Venmo: @mariasantos-design | PayPal: maria@santosdesign.com", normal))
    story.append(Paragraph("Due upon receipt. Thank you!", normal))
    doc.build(story)
    print("  Created: invoice_freelancer.pdf")


def make_invoice_3():
    """SaaS subscription invoice."""
    doc = SimpleDocTemplate(os.path.join(OUT_DIR, "invoice_saas.pdf"), pagesize=letter)
    story = []
    story.append(Paragraph("Vapi.ai — Invoice", title_style))
    story.append(Spacer(1, 8))

    info = [
        ["Invoice Number:", "VAPI-26-02-4471"],
        ["Invoice Date:", "February 1, 2026"],
        ["Due Date:", "February 1, 2026"],
        ["Payment Method:", "Visa ending 4242"],
        ["", ""],
        ["Billed To:", "AXIOM Collective"],
        ["", "Carolina Gomez"],
        ["", "Eagle Pass, TX 78852"],
    ]
    t = Table(info, colWidths=[120, 300])
    t.setStyle(TableStyle([("FONTSIZE", (0, 0), (-1, -1), 9)]))
    story.append(t)
    story.append(Spacer(1, 16))

    items = [
        ["Description", "Qty", "Unit Price", "Amount"],
        ["Growth Plan — Monthly Subscription\n(Feb 1 - Feb 28, 2026)", "1", "$49.00", "$49.00"],
        ["Voice Minutes — Overage\n(312 minutes @ $0.05/min)", "312", "$0.05", "$15.60"],
        ["Phone Number — US Local\n(+1-830-555-0147)", "1", "$2.00", "$2.00"],
    ]
    t = Table(items, colWidths=[280, 50, 80, 80])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6C5CE7")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    totals = [["", "", "Subtotal:", "$66.60"], ["", "", "Tax:", "$0.00"], ["", "", "Total Charged:", "$66.60"]]
    t = Table(totals, colWidths=[280, 50, 80, 80])
    t.setStyle(TableStyle([
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (2, 2), (-1, 2), "Helvetica-Bold"),
    ]))
    story.append(t)
    doc.build(story)
    print("  Created: invoice_saas.pdf")


def make_invoice_4():
    """Mexican vendor invoice (bilingual)."""
    doc = SimpleDocTemplate(os.path.join(OUT_DIR, "invoice_mexico_vendor.pdf"), pagesize=letter)
    story = []
    story.append(Paragraph("Factura / Invoice", title_style))
    story.append(Spacer(1, 8))

    info = [
        ["Emisor / From:", "Soluciones Digitales del Norte S.A. de C.V."],
        ["", "Blvd. Manuel J. Clouthier 245, Col. Jardin"],
        ["", "Piedras Negras, Coah. 26000, Mexico"],
        ["RFC:", "SDN2501156A3"],
        ["", ""],
        ["Cliente / Bill To:", "AXIOM Collective"],
        ["", "Eagle Pass, TX 78852, USA"],
        ["", ""],
        ["Folio:", "FV-2026-0019"],
        ["Fecha / Date:", "February 20, 2026"],
        ["Vencimiento / Due:", "March 20, 2026"],
    ]
    t = Table(info, colWidths=[120, 360])
    t.setStyle(TableStyle([("FONTSIZE", (0, 0), (-1, -1), 9)]))
    story.append(t)
    story.append(Spacer(1, 16))

    items = [
        ["Concepto / Description", "Cantidad", "Precio Unit.", "Importe"],
        ["Web hosting - Servidor dedicado\nDedicated server (Feb 2026)", "1", "$2,400.00 MXN", "$2,400.00 MXN"],
        ["Dominio withaxiom.co - Renovacion anual\nDomain renewal (1 year)", "1", "$350.00 MXN", "$350.00 MXN"],
        ["Certificado SSL - Wildcard\nSSL Certificate *.withaxiom.co", "1", "$1,200.00 MXN", "$1,200.00 MXN"],
    ]
    t = Table(items, colWidths=[240, 60, 100, 100])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#183A2B")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    totals = [
        ["", "", "Subtotal:", "$3,950.00 MXN"],
        ["", "", "IVA (16%):", "$632.00 MXN"],
        ["", "", "Total:", "$4,582.00 MXN"],
        ["", "", "USD Equivalent:", "~$228.00 USD"],
    ]
    t = Table(totals, colWidths=[240, 60, 100, 100])
    t.setStyle(TableStyle([
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (2, 2), (-1, 2), "Helvetica-Bold"),
    ]))
    story.append(t)
    doc.build(story)
    print("  Created: invoice_mexico_vendor.pdf")


def make_invoice_5():
    """Minimal invoice — edge case with sparse data."""
    doc = SimpleDocTemplate(os.path.join(OUT_DIR, "invoice_minimal.pdf"), pagesize=letter)
    story = []
    story.append(Paragraph("INVOICE", title_style))
    story.append(Spacer(1, 12))
    story.append(Paragraph("TechFix Pro", heading_style))
    story.append(Paragraph("Invoice #TFP-299", normal))
    story.append(Paragraph("March 1, 2026", normal))
    story.append(Spacer(1, 12))
    story.append(Paragraph("To: Carolina Gomez", normal))
    story.append(Spacer(1, 16))

    items = [
        ["Item", "Total"],
        ["MacBook Pro M4 repair — screen replacement", "$450.00"],
        ["Diagnostic fee", "$75.00"],
        ["Rush service surcharge", "$50.00"],
    ]
    t = Table(items, colWidths=[380, 100])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.black),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Total: $575.00</b>", normal))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Pay via Zelle: techfixpro@gmail.com", normal))
    doc.build(story)
    print("  Created: invoice_minimal.pdf")


if __name__ == "__main__":
    print("Generating 5 test invoices...")
    make_invoice_1()
    make_invoice_2()
    make_invoice_3()
    make_invoice_4()
    make_invoice_5()
    print(f"\nAll invoices saved to: {OUT_DIR}")
