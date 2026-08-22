/**
 * Document text extraction: PDF (unpdf), DOCX (mammoth), plain text.
 * Runs server-side only. All content is treated as untrusted input.
 */
import { cleanText, normalizeForParsing } from "@/lib/parsing/text-clean";

export type SupportedDocType = "pdf" | "docx" | "txt";

export class DocumentParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentParseError";
  }
}

/** Magic-byte sniffing — never trust the client-provided MIME type. */
export function detectType(fileName: string, bytes: Uint8Array): SupportedDocType {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  const head = Buffer.from(bytes.slice(0, 8)).toString("latin1");

  if (head.startsWith("%PDF-")) return "pdf";
  if (head.startsWith("PK")) return "docx"; // zip container (docx)
  if ((ext === "txt" || ext === "md") && looksLikeText(bytes)) return "txt";
  if (ext === "pdf" && head.startsWith("%PDF")) return "pdf";

  throw new DocumentParseError(
    `Unsupported or corrupted file "${sanitizeFileName(fileName)}". Allowed: PDF, DOCX, TXT.`,
  );
}

function looksLikeText(bytes: Uint8Array): boolean {
  const sample = bytes.slice(0, Math.min(bytes.length, 2048));
  let printable = 0;
  for (const b of sample) {
    if (b === 9 || b === 10 || b === 13 || (b >= 32 && b < 127) || b >= 160) printable++;
  }
  return sample.length > 0 && printable / sample.length > 0.85;
}

/** Remove path traversal & control characters from user-supplied file names. */
export function sanitizeFileName(name: string): string {
  return (
    name
      .replace(/[/\\]/g, "_")
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F]/g, "")
      .replace(/\.\./g, "_")
      .slice(0, 180) || "unnamed"
  );
}

export async function extractText(
  fileName: string,
  bytes: Uint8Array,
): Promise<string> {
  const type = detectType(fileName, bytes);

  if (type === "txt") {
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return normalizeForParsing(cleanText(decoded));
  }

  if (type === "pdf") {
    try {
      const { extractText: unpdfExtract, getDocumentProxy } = await import("unpdf");
      const buffer = Buffer.from(bytes);
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await unpdfExtract(pdf, { mergePages: true });
      const merged = Array.isArray(text) ? text.join("\n\n") : text;
      if (!merged || merged.replace(/\s/g, "").length < 40) {
        throw new DocumentParseError(
          `PDF "${sanitizeFileName(fileName)}" appears to be scanned/image-only. Text-based PDFs are required.`,
        );
      }
      return normalizeForParsing(cleanText(merged));
    } catch (err) {
      if (err instanceof DocumentParseError) throw err;
      throw new DocumentParseError(
        `Could not read PDF "${sanitizeFileName(fileName)}". The file may be corrupted or password-protected.`,
      );
    }
  }

  // DOCX
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    if (!result.value || result.value.replace(/\s/g, "").length < 20) {
      throw new DocumentParseError(`DOCX "${sanitizeFileName(fileName)}" contains no readable text.`);
    }
    return normalizeForParsing(cleanText(result.value));
  } catch (err) {
    if (err instanceof DocumentParseError) throw err;
    throw new DocumentParseError(
      `Could not read document "${sanitizeFileName(fileName)}". Only .docx is supported (not legacy .doc).`,
    );
  }
}
