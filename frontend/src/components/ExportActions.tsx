import { useState } from "react";
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
