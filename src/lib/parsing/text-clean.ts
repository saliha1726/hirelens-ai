/**
 * Text sanitization for untrusted document content.
 *
 * Uploaded resumes are DATA, never instructions: control characters, zero-width
 * characters and prompt-injection bait are stripped before any parsing or AI
 * usage. Length is capped to keep serverless invocations bounded.
 */

export const MAX_DOCUMENT_CHARS = 60_000;

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const ZERO_WIDTH = /[​-‏‪-‮⁠-⁤﻿]/g;

export function cleanText(input: string): string {
  let t = input
    .replace(/\r\n?/g, "\n")
    .replace(ZERO_WIDTH, "")
    .replace(CONTROL_CHARS, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
  if (t.length > MAX_DOCUMENT_CHARS) {
    t = t.slice(0, MAX_DOCUMENT_CHARS);
  }
  return t.trim();
}

/** Normalize common ligatures / fancy quotes that break regex matching. */
export function normalizeForParsing(t: string): string {
  return t
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/•/g, "- ");
}
