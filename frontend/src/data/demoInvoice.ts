import type { Invoice } from "../types/invoice";

export const DEMO_INVOICE: Invoice = {
  vendor_name: "Stratton Design Co.",
  vendor_address: "742 Evergreen Terrace, Suite 200, Austin, TX 78701",
  invoice_number: "SDC-2026-0847",
  invoice_date: "2026-03-01",
  due_date: "2026-03-31",
  bill_to: "AXIOM Collective LLC\n1200 Main St, Miami, FL 33101",
  line_items: [
    {
      description: "Brand Identity Package — logo, color palette, typography",
      quantity: 1,
      unit_price: 4500.0,
      total: 4500.0,
    },
    {
      description: "Website Design — 8-page responsive site (Figma)",
      quantity: 1,
      unit_price: 6200.0,
      total: 6200.0,
    },
    {
      description: "Social Media Templates (Instagram, LinkedIn)",
      quantity: 12,
      unit_price: 75.0,
      total: 900.0,
    },
    {
      description: "Brand Guidelines Document (PDF)",
      quantity: 1,
      unit_price: 1200.0,
      total: 1200.0,
    },
  ],
  subtotal: 12800.0,
  tax: 1024.0,
  total: 13824.0,
  currency: "USD",
  payment_terms: "Net 30",
  notes: "Thank you for your business. Payment via ACH or wire transfer preferred.",
  _warnings: [],
  _extracted_at: new Date().toISOString(),
};

export const DEMO_CSV = `Invoice Summary
Vendor,Stratton Design Co.
Invoice #,SDC-2026-0847
Date,2026-03-01
Due Date,2026-03-31
Bill To,"AXIOM Collective LLC, 1200 Main St, Miami, FL 33101"

Line Items
Description,Quantity,Unit Price,Total
"Brand Identity Package — logo, color palette, typography",1,4500.00,4500.00
"Website Design — 8-page responsive site (Figma)",1,6200.00,6200.00
"Social Media Templates (Instagram, LinkedIn)",12,75.00,900.00
Brand Guidelines Document (PDF),1,1200.00,1200.00

Subtotal,,,12800.00
Tax,,,1024.00
Total,,,13824.00
`;
