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
        AXIOM Collective &middot; AI-Powered Invoice Processing &middot; Bilingual EN/ES
      </footer>
    </div>
  );
}
