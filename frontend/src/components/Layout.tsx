import { useState, type ReactNode } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-axiom-bg text-slate-900 dark:text-axiom-text">
      {/* Header */}
      <header className="bg-gradient-to-r from-axiom-green to-axiom-navy border-b-[3px] border-axiom-gold px-4 py-4 md:px-12 md:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 -ml-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle history sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div>
              <p className="text-[10px] md:text-[11px] tracking-[5px] md:tracking-[6px] text-axiom-gold uppercase font-serif">
                AXIOM Collective
              </p>
              <h1 className="text-xl md:text-2xl font-serif text-white mt-0.5">Invoice Processor</h1>
              <p className="text-white/40 text-xs md:text-sm hidden sm:block">
                Upload a PDF invoice. Get structured data in seconds.
              </p>
            </div>
          </div>
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed md:sticky top-0 md:top-auto left-0 z-30 md:z-auto
          w-72 md:w-64 h-full md:h-auto min-h-[calc(100vh-100px)]
          border-r border-slate-200 dark:border-axiom-border
          bg-white dark:bg-axiom-card p-4
          transform transition-transform duration-200 ease-out md:transform-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-wider text-slate-500 dark:text-axiom-muted font-semibold">
              History
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded text-slate-400 hover:text-slate-600 dark:text-axiom-muted dark:hover:text-axiom-text"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {history.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 mb-2">
                <svg className="w-5 h-5 text-slate-300 dark:text-axiom-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-xs text-slate-400 dark:text-axiom-muted">No invoices yet</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {history.map((inv) => (
                <li key={inv.id}>
                  <button
                    onClick={() => { onSelectInvoice(inv.id); setSidebarOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      selectedId === inv.id
                        ? "bg-axiom-gold/10 text-axiom-gold border border-axiom-gold/30"
                        : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-axiom-text"
                    }`}
                  >
                    <div className="font-medium truncate">
                      {inv.invoice.invoice_number || inv.filename}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-axiom-muted mt-0.5 flex items-center justify-between">
                      <span className="truncate">{inv.invoice.vendor_name || "Unknown vendor"}</span>
                      {inv.invoice.total != null && (
                        <span className="font-mono ml-2 shrink-0">${Number(inv.invoice.total).toLocaleString()}</span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-10 max-w-4xl w-full">
          {children}
        </main>
      </div>

      <footer className="border-t border-slate-200 dark:border-axiom-border p-5 text-center">
        <p className="text-xs text-slate-400 dark:text-axiom-muted">
          Built by <span className="font-semibold text-axiom-gold">AXIOM Collective</span> &middot; AI-Powered Automation &middot; EN/ES
        </p>
      </footer>
    </div>
  );
}
