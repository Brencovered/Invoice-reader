import "dotenv/config";
import express from "express";
import multer from "multer";
import pdf from "pdf-parse";
import { parseWoolworthsInvoice } from "./woolworthsParser";
import { invoiceToGroceryRows } from "./saveToSupabase";

const app = express();
const upload = multer(); // store files in memory
const port = process.env.PORT || 3000;

// Simple upload form
app.get("/", (_req, res) => {
  res.send(`
    <html>
      <head>
        <title>Covered Invoice Upload</title>
      </head>
      <body style="font-family: sans-serif; padding: 2rem;">
        <h1>Upload Woolworths Invoice (PDF)</h1>
        <form action="/upload-invoice" method="post" enctype="multipart/form-data">
          <input type="file" name="invoice" accept="application/pdf" required />
          <button type="submit">Upload & Parse</button>
        </form>
        <p>After upload, you'll see the parsed items as JSON.</p>
      </body>
    </html>
  `);
});

// Handle PDF upload and parse it
app.post("/upload-invoice", upload.single("invoice"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Field name must be 'invoice'." });
    }

    // The PDF as a buffer
    const buffer = req.file.buffer;

    // Extract text from the uploaded PDF (no need to write to disk)
    const pdfData = await pdf(buffer);
    const text = pdfData.text;

    // Parse Woolworths invoice
    const parsed = parseWoolworthsInvoice(text);

    // Map to your grocery_items row structure (using DEFAULT_USER_ID or a dummy)
    const userId = process.env.DEFAULT_USER_ID || "demo-user";
    const groceryRows = invoiceToGroceryRows(parsed, userId);

    // For testing, just return JSON (no DB insert)
    res.json({
      meta: parsed.meta,
      items: parsed.items,
      groceryRows
    });
  } catch (err: any) {
    console.error("Error handling upload:", err);
    res.status(500).json({ error: "Failed to parse invoice", details: err.message ?? String(err) });
  }
});

app.listen(port, () => {
  console.log(`Invoice upload server running at http://localhost:${port}`);
});
