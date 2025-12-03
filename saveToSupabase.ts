import { supabase } from "./supabaseClient";
import { GroceryItemRow, ParsedInvoice } from "./types";
import "dotenv/config";

const GROCERY_TABLE = process.env.SUPABASE_GROCERY_TABLE ?? "grocery_items";
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? "";

function mapCategory(rawCategory: string | null): string | null {
  if (!rawCategory) return null;
  if (/Fruit & Vegetables/i.test(rawCategory)) return "Fruit/Veg";
  return rawCategory;
}

export function invoiceToGroceryRows(
  parsed: ParsedInvoice,
  userId: string
): GroceryItemRow[] {
  const purchaseDate = parsed.meta.date ?? null;

  return parsed.items.map((item) => {
    const category = mapCategory(item.category);
    const unit = "each";

    const row: GroceryItemRow = {
      user_id: userId,
      item_name: item.description,
      category,
      last_purchased: purchaseDate,
      price: item.unitPrice,
      quantity: item.suppliedQty,
      unit,
      source: "woolworths_invoice",
      woolworths_product_id: null,
      coles_product_id: null,
      image_url: null,
      expiration_date: null,
      used: false,
      category_id: null,
      invoice_id: parsed.meta.invoiceNumber
        ? parseInt(parsed.meta.invoiceNumber, 10)
        : null
    };

    return row;
  });
}

export async function saveGroceryRows(rows: GroceryItemRow[]): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client not configured.");
  }

  if (!rows.length) {
    console.log("No rows to insert.");
    return;
  }

  const { error } = await supabase.from(GROCERY_TABLE).insert(rows);

  if (error) {
    console.error("Error inserting grocery rows:", error);
    throw error;
  }

  console.log(`Inserted ${rows.length} grocery_items rows into ${GROCERY_TABLE}`);
}
