const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const app = express();
const upload = multer(); // keep files in memory
const port = process.env.PORT || 3000;

function normaliseSpaces(s) {
  return s.replace(/\s+/g, " ").trim();
}

// Very simple Woolworths-style parser.
// If it can't match properly, you'll at least see the raw text.
function parseWoolworthsInvoice(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Meta
  const invoiceMatch = text.match(/Invoice\/Order Number:\s*(\d+)/i);
  const dateMatch = text.match(/Date:\s*([0-9]{1,2}\s+\w+\s+[0-9]{4})/i);
  const customerMatch = text.match(/Customer:\s*(.+)/i);

  const meta = {
    retailer: "woolworths",
    invoiceNumber: invoiceMatch ? invoiceMatch[1].trim() : null,
    date: dateMatch ? dateMatch[1].trim() : null,
    customerName: customerMatch ? customerMatch[1].trim() : null
  };

  // Items
  const items = [];
  let currentCategory = null;

  const headerIndex = lines.findIndex((l) =>
    /^Line\s+Description\s+Ordered\s+Supplied\s+Price\s+Amount$/i.test(
      normaliseSpaces(l)
    )
  );

  if (headerIndex !== -1) {
    const itemRegex =
      /^(\d+)\s+(.+?)\s+(\d+)\s+(\d+)\s+\$([\d.]+)\s+\$([\d.]+)$/;

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const rawLine = lines[i];

      if (/^Sub Total:/i.test(rawLine) || /^Registered Office:/i.test(rawLine)) {
        break;
      }

      if (!/^\d+/.test(rawLine)) {
        if (rawLine.length <= 40) {
          currentCategory = normaliseSpaces(rawLine);
        }
        continue;
      }

      const m = normaliseSpaces(rawLine).match(itemRegex);
      if (!m) continue;

      const [, lineNumberStr, desc, orderedStr, suppliedStr, priceStr, amountStr] =
        m;

      items.push({
        lineNumber: parseInt(lineNumberStr, 10),
        description: normaliseSpaces(desc),
        category: currentCategory,
        orderedQty: parseInt(orderedStr, 10),
        suppliedQty: parseInt(suppliedStr, 10),
        unitPrice: parseFloat(priceStr),
        lineTotal: parseFloat(amountStr)
      });
    }
  }

  return { meta, items };
}

// Simple HTML upload page
app.get("/", (_req, res) => {
  res.send(`
    <html>
      <head><title>Covered Invoice Upload</title></head>
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

// Handle file upload + parse
app.post("/upload-invoice", upload.single("invoice"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file uploaded. Field name must be 'invoice'." });
    }

    const buffer = req.file.buffer;
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    const parsed = parseWoolworthsInvoice(text);

    // For now, just return the parsed data. You can later map to pantry rows.
    res.json({
      meta: parsed.meta,
      items: parsed.items,
      rawTextPreview: text.slice(0, 1000) // just in case you want to inspect
    });
  } catch (err) {
    console.error("Error handling upload:", err);
    res
      .status(500)
      .json({ error: "Failed to parse invoice", details: String(err.message || err) });
  }
});

app.listen(port, () => {
  console.log(`Invoice upload server running at http://localhost:${port}`);
});
