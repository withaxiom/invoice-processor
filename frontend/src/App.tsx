import { useTheme } from "./hooks/useTheme";
import { useInvoices } from "./hooks/useInvoices";
import { Layout } from "./components/Layout";
import { UploadZone } from "./components/UploadZone";
import { ProcessingState } from "./components/ProcessingState";
import { InvoiceSummary } from "./components/InvoiceSummary";
import { LineItemsTable } from "./components/LineItemsTable";
import { ExportActions } from "./components/ExportActions";
import { WarningBanner } from "./components/WarningBanner";

function App() {
  const { theme, toggle } = useTheme();
  const {
    history,
    current,
    status,
    error,
    batchProgress,
    processFiles,
    loadDemo,
    selectInvoice,
    updateCurrentInvoice,
    reset,
  } = useInvoices();

  return (
    <Layout
      theme={theme}
      onThemeToggle={toggle}
      history={history}
      selectedId={current?.id || null}
      onSelectInvoice={selectInvoice}
    >
      {status === "idle" && (
        <UploadZone onFiles={processFiles} onDemo={loadDemo} />
      )}

      {status === "processing" && (
        <ProcessingState progress={batchProgress || undefined} />
      )}

      {status === "error" && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-axiom-error/10 mb-4">
            <svg className="w-7 h-7 text-axiom-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-axiom-error text-sm mb-1 font-medium">Something went wrong</p>
          <p className="text-slate-500 dark:text-axiom-muted text-sm mb-6 max-w-md mx-auto">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-axiom-gold text-black hover:bg-axiom-gold-light transition-colors"
            >
              Try again
            </button>
            <button
              onClick={loadDemo}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 dark:border-axiom-border text-slate-700 dark:text-axiom-text hover:border-axiom-gold hover:text-axiom-gold transition-colors"
            >
              Try demo instead
            </button>
          </div>
        </div>
      )}

      {status === "done" && current && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-serif text-slate-800 dark:text-white">
                Extracted Data
              </h2>
              <p className="text-xs text-slate-400 dark:text-axiom-muted mt-0.5">
                Click any field to edit &middot; {current.filename}
              </p>
            </div>
          </div>

          <InvoiceSummary
            invoice={current.invoice}
            onUpdate={updateCurrentInvoice}
          />

          <WarningBanner warnings={current.invoice._warnings || []} />

          <LineItemsTable
            invoice={current.invoice}
            onUpdate={updateCurrentInvoice}
          />

          <ExportActions
            invoice={current.invoice}
            csv={current.csv}
            onReset={reset}
          />
        </div>
      )}
    </Layout>
  );
}

export default App;
