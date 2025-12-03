import "dotenv/config";
import { loadPdfText } from "./pdfUtils";
import { parseWoolworthsInvoice } from "./woolworthsParser";
import { invoiceToGroceryRows, saveGroceryRows } from "./saveToSupabase";

async function main() {
  const [, , filePath] = process.argv;

  if (!filePath) {
    console.error(
      "Usage: npm run parse:custom -- path/to/invoice.pdf\nDefault: npm run parse uses sample-data/280749993.pdf"
    );
    process.exit(1);
  }

  try {
    console.log(`Reading PDF: ${filePath}`);
    const raw = await loadPdfText(filePath);

    const parsed = parseWoolworthsInvoice(raw.text);

    console.log("Invoice meta:", parsed.meta);
    console.log(`Found ${parsed.items.length} line items.`);

    const userId =
      process.env.DEFAULT_USER_ID ??
      (() => {
        throw new Error("DEFAULT_USER_ID not set in .env");
      })();

    const rows = invoiceToGroceryRows(parsed, userId);

    console.log("Preview of rows mapped to grocery_items:");
    console.log(JSON.stringify(rows, null, 2));

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("Attempting to insert rows into Supabase...");
      await saveGroceryRows(rows);
    } else {
      console.warn(
        "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing – skipping DB insert."
      );
    }

    console.log("Done.");
  } catch (err) {
    console.error("Error in parser:", err);
    process.exit(1);
  }
}

main();
