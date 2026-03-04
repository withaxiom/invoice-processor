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
      {status === "idle" && <UploadZone onFiles={processFiles} />}

      {status === "processing" && (
        <ProcessingState progress={batchProgress || undefined} />
      )}

      {status === "error" && (
        <div className="text-center py-16">
          <p className="text-axiom-error text-sm mb-4">{error}</p>
          <button
            onClick={reset}
            className="px-5 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-axiom-border text-slate-700 dark:text-axiom-text hover:border-axiom-gold hover:text-axiom-gold transition-colors"
          >
            Try another invoice
          </button>
        </div>
      )}

      {status === "done" && current && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif text-slate-800 dark:text-white">
              Extracted Data
            </h2>
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
