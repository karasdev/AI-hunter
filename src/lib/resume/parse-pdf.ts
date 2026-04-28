import { PDFParse } from "pdf-parse";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

export function assertPdfSize(buffer: Buffer) {
  if (buffer.length > MAX_PDF_BYTES) {
    throw new Error("PDF is too large (max 10 MB).");
  }
  if (buffer.length === 0) {
    throw new Error("Empty file.");
  }
}

export async function parseResumePdf(buffer: Buffer): Promise<string> {
  assertPdfSize(buffer);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    const text = result.text?.trim() ?? "";
    if (text.length < 20) {
      throw new Error("Could not extract enough text from the PDF. Try a text-based export.");
    }
    return text;
  } finally {
    await parser.destroy();
  }
}
