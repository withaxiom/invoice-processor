export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  vendor_name: string;
  vendor_address: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  bill_to: string | null;
  line_items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  payment_terms: string | null;
  notes: string | null;
  _warnings?: string[];
  _extracted_at?: string;
}

export interface ExtractResponse {
  invoice: Invoice;
  csv: string;
  error?: string;
}

export interface BatchEvent {
  index: number;
  filename: string;
  invoice?: Invoice;
  csv?: string;
  error?: string;
  total?: number;
  done?: boolean;
}

export interface StoredInvoice {
  id: string;
  filename: string;
  invoice: Invoice;
  csv: string;
  processedAt: string;
}
