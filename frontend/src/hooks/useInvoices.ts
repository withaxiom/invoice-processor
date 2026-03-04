import { useState, useCallback } from "react";
import type { Invoice, StoredInvoice, BatchEvent } from "../types/invoice";
import { extractInvoice, extractBatch } from "../api/invoices";

const STORAGE_KEY = "axiom-invoice-history";

function loadHistory(): StoredInvoice[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(history: StoredInvoice[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

type Status = "idle" | "processing" | "done" | "error";

export function useInvoices() {
  const [history, setHistory] = useState<StoredInvoice[]>(loadHistory);
  const [current, setCurrent] = useState<StoredInvoice | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const addToHistory = useCallback((entry: StoredInvoice) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 50);
      saveHistory(next);
      return next;
    });
  }, []);

  const processFiles = useCallback(
    async (files: File[]) => {
      setStatus("processing");
      setError(null);
      setBatchProgress(null);

      try {
        if (files.length === 1) {
          const result = await extractInvoice(files[0]);
          const entry: StoredInvoice = {
            id: crypto.randomUUID(),
            filename: files[0].name,
            invoice: result.invoice,
            csv: result.csv,
            processedAt: new Date().toISOString(),
          };
          setCurrent(entry);
          addToHistory(entry);
          setStatus("done");
        } else {
          setBatchProgress({ current: 0, total: files.length });
          const results: StoredInvoice[] = [];

          await extractBatch(files, (event: BatchEvent) => {
            if (event.done) return;

            if (event.invoice && event.csv) {
              const entry: StoredInvoice = {
                id: crypto.randomUUID(),
                filename: event.filename,
                invoice: event.invoice,
                csv: event.csv,
                processedAt: new Date().toISOString(),
              };
              results.push(entry);
              addToHistory(entry);
            }

            setBatchProgress((prev) => ({
              current: (prev?.current || 0) + 1,
              total: event.total || files.length,
            }));
          });

          if (results.length > 0) {
            setCurrent(results[0]);
          }
          setStatus("done");
          setBatchProgress(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Processing failed");
        setStatus("error");
      }
    },
    [addToHistory]
  );

  const selectInvoice = useCallback(
    (id: string) => {
      const found = history.find((h) => h.id === id);
      if (found) {
        setCurrent(found);
        setStatus("done");
        setError(null);
      }
    },
    [history]
  );

  const updateCurrentInvoice = useCallback(
    (invoice: Invoice) => {
      if (!current) return;
      const updated = { ...current, invoice };
      setCurrent(updated);
      setHistory((prev) => {
        const next = prev.map((h) => (h.id === updated.id ? updated : h));
        saveHistory(next);
        return next;
      });
    },
    [current]
  );

  const reset = useCallback(() => {
    setCurrent(null);
    setStatus("idle");
    setError(null);
    setBatchProgress(null);
  }, []);

  return {
    history,
    current,
    status,
    error,
    batchProgress,
    processFiles,
    selectInvoice,
    updateCurrentInvoice,
    reset,
  };
}
