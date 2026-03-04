import { useState, useRef, type DragEvent } from "react";

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadZone({ onFiles, disabled }: UploadZoneProps) {
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
    <div
      onDragEnter={(e) => { handleDrag(e); setDragOver(true); }}
      onDragOver={(e) => { handleDrag(e); setDragOver(true); }}
      onDragLeave={(e) => { handleDrag(e); setDragOver(false); }}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${dragOver
          ? "border-axiom-gold bg-axiom-gold/5"
          : "border-slate-300 dark:border-axiom-border bg-white dark:bg-axiom-card hover:border-axiom-gold hover:bg-axiom-gold/[0.02]"
        }`}
    >
      <div className="text-5xl mb-4 opacity-60">&#128196;</div>
      <h2 className="text-xl font-serif text-slate-800 dark:text-white mb-2">
        Drop your invoices here
      </h2>
      <p className="text-sm text-slate-500 dark:text-axiom-muted">
        or click to browse &mdash; PDF files up to 16MB &mdash; multiple files supported
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
  );
}
