interface ProcessingStateProps {
  message?: string;
  progress?: { current: number; total: number };
}

export function ProcessingState({ message, progress }: ProcessingStateProps) {
  return (
    <div className="text-center py-16">
      <div className="relative inline-block mb-6">
        <div className="w-14 h-14 border-[3px] border-slate-200 dark:border-axiom-border border-t-axiom-gold rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-6 h-6 text-axiom-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
      </div>
      <p className="text-slate-700 dark:text-axiom-text text-sm font-medium">
        {message || "Extracting invoice data with Claude..."}
      </p>
      {progress && (
        <div className="mt-4 max-w-xs mx-auto">
          <div className="h-1.5 bg-slate-200 dark:bg-axiom-border rounded-full overflow-hidden">
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
      <p className="text-xs text-slate-400 dark:text-axiom-muted mt-3">
        This usually takes 5-15 seconds per invoice
      </p>
    </div>
  );
}
