export interface RawPdfInvoice {
  text: string;
  filePath: string;
}

export interface ParsedInvoiceItem {
  lineNumber: number;
  description: string;
  category: string | null;
  orderedQty: number;
  suppliedQty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ParsedInvoiceMeta {
  retailer: "woolworths";
  invoiceNumber: string | null;
  customerName: string | null;
  date: string | null;
}

export interface ParsedInvoice {
  meta: ParsedInvoiceMeta;
  items: ParsedInvoiceItem[];
}

/**
 * Shape aligned with your `Grocery Items` table.
 */
export interface GroceryItemRow {
  user_id: string;
  item_name: string;
  category: string | null;
  last_purchased: string | null;
  frequency?: number | null;
  woolworths_product_id?: string | null;
  coles_product_id?: string | null;
  price: number;
  quantity: number;
  unit: string;
  source: string;
  image_url?: string | null;
  expiration_date?: string | null;
  used?: boolean;
  category_id?: number | null;
  invoice_id?: number | null;
}
