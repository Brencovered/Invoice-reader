import { ParsedInvoice, ParsedInvoiceItem, ParsedInvoiceMeta } from "./types";

function normaliseSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function extractMeta(text: string): ParsedInvoiceMeta {
  const invoiceMatch = text.match(/Invoice\/Order Number:\s*(\d+)/i);
  const customerMatch = text.match(/Customer:\s*(.+)/i);
  const dateMatch = text.match(/Date:\s*([0-9]{1,2}\s+\w+\s+[0-9]{4})/i);

  return {
    retailer: "woolworths",
    invoiceNumber: invoiceMatch ? invoiceMatch[1].trim() : null,
    customerName: customerMatch ? customerMatch[1].trim() : null,
    date: dateMatch ? dateMatch[1].trim() : null
  };
}

function extractItems(text: string): ParsedInvoiceItem[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const headerIndex = lines.findIndex((l) =>
    /^Line\s+Description\s+Ordered\s+Supplied\s+Price\s+Amount$/i.test(
      normaliseSpaces(l)
    )
  );

  if (headerIndex === -1) {
    console.warn("Could not find Woolworths items header line.");
    return [];
  }

  const items: ParsedInvoiceItem[] = [];
  let currentCategory: string | null = null;

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
    if (!m) {
      continue;
    }

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

  const subsHeaderIndex = lines.findIndex((l) =>
    /^Substitutions$/i.test(l)
  );

  if (subsHeaderIndex !== -1) {
    let category: string | null = null;

    for (let i = subsHeaderIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^Sub Total:/i.test(line) || /^Registered Office:/i.test(line)) {
        break;
      }

      if (!/^\d+/.test(line)) {
        if (line.length <= 40) {
          category = normaliseSpaces(line);
        }
        continue;
      }

      const subMatch =
        /^(\d+)\s+(.+?)\s+(\d+)\s+(\d+)\s+\$([\d.]+)\s+\$([\d.]+)$/i.exec(
          normaliseSpaces(line)
        );

      if (!subMatch) continue;

      const [
        ,
        lineNumberStr,
        desc,
        orderedStr,
        suppliedStr,
        priceStr,
        amountStr
      ] = subMatch;

      items.push({
        lineNumber: parseInt(lineNumberStr, 10),
        description: normaliseSpaces(desc),
        category: category ?? "Substitutions",
        orderedQty: parseInt(orderedStr, 10),
        suppliedQty: parseInt(suppliedStr, 10),
        unitPrice: parseFloat(priceStr),
        lineTotal: parseFloat(amountStr)
      });
    }
  }

  return items;
}

export function parseWoolworthsInvoice(text: string): ParsedInvoice {
  const meta = extractMeta(text);
  const items = extractItems(text);

  return { meta, items };
}
