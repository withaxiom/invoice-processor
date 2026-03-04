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
