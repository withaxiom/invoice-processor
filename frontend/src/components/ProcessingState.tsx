interface ProcessingStateProps {
  message?: string;
  progress?: { current: number; total: number };
}

export function ProcessingState({ message, progress }: ProcessingStateProps) {
  return (
    <div className="text-center py-16">
      <div className="w-12 h-12 border-[3px] border-slate-200 dark:border-axiom-border border-t-axiom-gold rounded-full animate-spin mx-auto mb-5" />
      <p className="text-slate-600 dark:text-axiom-muted text-sm">
        {message || "Extracting invoice data with Claude..."}
      </p>
      {progress && (
        <div className="mt-4 max-w-xs mx-auto">
          <div className="h-2 bg-slate-200 dark:bg-axiom-border rounded-full overflow-hidden">
            <div
              className="h-full bg-axiom-gold rounded-full transition-all duration-500"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-axiom-muted mt-2">
            {progress.current} of {progress.total} invoices processed
          </p>
        </div>
      )}
      <p className="text-xs text-slate-400 dark:text-axiom-muted mt-2">
        This usually takes 5–15 seconds per invoice
      </p>
    </div>
  );
}
