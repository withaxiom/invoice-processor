import { useState } from "react";
import type { Invoice } from "../types/invoice";

interface ExportActionsProps {
  invoice: Invoice;
  csv: string;
  onReset: () => void;
}

export function ExportActions({ invoice, csv, onReset }: ExportActionsProps) {
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  function downloadCSV() {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `axiom_extracted_${invoice.invoice_number || "invoice"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(cleanJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `axiom_extracted_${invoice.invoice_number || "invoice"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(cleanJson, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = JSON.stringify(cleanJson, null, 2);
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const cleanJson = Object.fromEntries(
    Object.entries(invoice).filter(([k]) => !k.startsWith("_"))
  );

  const outlineBtn = "px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 dark:border-axiom-border text-slate-700 dark:text-axiom-text hover:border-axiom-gold hover:text-axiom-gold transition-colors";

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={downloadCSV}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-axiom-gold text-black hover:bg-axiom-gold-light transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download CSV
        </button>
        <button onClick={downloadJSON} className={outlineBtn}>
          Download JSON
        </button>
        <button
          onClick={() => setShowJson(!showJson)}
          className={outlineBtn}
        >
          {showJson ? "Hide JSON" : "View JSON"}
        </button>
        <div className="flex-1" />
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 dark:border-axiom-border text-slate-700 dark:text-axiom-text hover:border-axiom-gold hover:text-axiom-gold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Invoice
        </button>
      </div>

      {showJson && (
        <div className="mt-4 relative">
          <button
            onClick={copyJson}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-md text-xs font-medium bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <pre className="bg-slate-50 dark:bg-[#0D0D0D] border border-slate-200 dark:border-axiom-border rounded-xl p-4 pt-5 overflow-x-auto text-xs leading-relaxed font-mono max-h-[500px] overflow-y-auto">
            {JSON.stringify(cleanJson, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
