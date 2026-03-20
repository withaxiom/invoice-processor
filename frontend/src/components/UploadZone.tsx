import { useState, useRef, type DragEvent } from "react";

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
  onDemo: () => void;
  disabled?: boolean;
}

export function UploadZone({ onFiles, onDemo, disabled }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrag(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf"
    );
    if (files.length > 0) onFiles(files);
  }

  function handleChange() {
    const files = Array.from(inputRef.current?.files || []);
    if (files.length > 0) onFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <div
        onDragEnter={(e) => { handleDrag(e); setDragOver(true); }}
        onDragOver={(e) => { handleDrag(e); setDragOver(true); }}
        onDragLeave={(e) => { handleDrag(e); setDragOver(false); }}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`group border-2 border-dashed rounded-2xl p-12 md:p-16 text-center cursor-pointer transition-all duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${dragOver
            ? "border-axiom-gold bg-axiom-gold/5 scale-[1.01]"
            : "border-slate-300 dark:border-axiom-border bg-white dark:bg-axiom-card hover:border-axiom-gold/60 hover:bg-axiom-gold/[0.02]"
          }`}
      >
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 transition-colors duration-200 ${
          dragOver ? "bg-axiom-gold/15" : "bg-slate-100 dark:bg-white/5 group-hover:bg-axiom-gold/10"
        }`}>
          <svg className={`w-8 h-8 transition-colors duration-200 ${dragOver ? "text-axiom-gold" : "text-slate-400 dark:text-axiom-muted group-hover:text-axiom-gold"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-serif text-slate-800 dark:text-white mb-2">
          Drop your invoices here
        </h2>
        <p className="text-sm text-slate-500 dark:text-axiom-muted mb-1">
          or click to browse
        </p>
        <p className="text-xs text-slate-400 dark:text-axiom-muted">
          PDF files up to 16 MB &middot; multiple files supported
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200 dark:bg-axiom-border" />
        <span className="text-xs text-slate-400 dark:text-axiom-muted uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-axiom-border" />
      </div>

      <button
        onClick={onDemo}
        disabled={disabled}
        className="w-full py-3.5 rounded-xl text-sm font-semibold border-2 border-dashed border-axiom-gold/40 text-axiom-gold hover:bg-axiom-gold/5 hover:border-axiom-gold/70 transition-all duration-200 disabled:opacity-50"
      >
        Try with a sample invoice — no API key needed
      </button>
    </div>
  );
}
