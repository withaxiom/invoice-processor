import type { ExtractResponse, BatchEvent } from "../types/invoice";

export async function extractInvoice(file: File): Promise<ExtractResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/extract", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function extractBatch(
  files: File[],
  onEvent: (event: BatchEvent) => void
): Promise<void> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const res = await fetch("/api/extract/batch", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Batch request failed");

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const event: BatchEvent = JSON.parse(line.slice(6));
        onEvent(event);
        if (event.done) return;
      }
    }
  }
}
