import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import { RawPdfInvoice } from "./types";

export async function loadPdfText(filePath: string): Promise<RawPdfInvoice> {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`PDF file not found: ${resolved}`);
  }

  const dataBuffer = fs.readFileSync(resolved);
  const parsed = await pdf(dataBuffer);

  return {
    text: parsed.text,
    filePath: resolved
  };
}
