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
    const numericFields: (keyof Invoice)[] = ["subtotal", "tax", "total"];
    const parsed = numericFields.includes(field)
      ? parseFloat(val.replace(/[$,]/g, "")) || 0
      : val;
    onUpdate({ ...invoice, [field]: parsed });
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
