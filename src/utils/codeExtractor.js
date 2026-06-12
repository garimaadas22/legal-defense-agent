/**
 * utils/codeExtractor.js
 *
 * Extracts code blocks from a user message string.
 *
 * Handles:
 *   1. Fenced code blocks (``` or ~~~), with or without language tags.
 *   2. Inline code spans (`...`) longer than 20 characters.
 *   3. Indented code blocks (4-space or tab indented paragraphs).
 *
 * Returns an array of raw code strings (no fences, no backticks).
 */

/**
 * extractCodeBlocks
 * @param {string} text – raw message content from the user
 * @returns {string[]} – array of extracted code strings
 */
export function extractCodeBlocks(text) {
  if (!text) return [];

  const blocks = [];

  // ── 1. Fenced code blocks: ```lang\n...\n``` or ~~~\n...\n~~~ ────────────
  const fencedRegex = /^(?:```|~~~)[^\n]*\n([\s\S]*?)^(?:```|~~~)\s*$/gm;
  let match;
  while ((match = fencedRegex.exec(text)) !== null) {
    const code = match[1].trim();
    if (code) blocks.push(code);
  }

  // If fenced blocks were found, they are the explicit intent – return early.
  if (blocks.length) return blocks;

  // ── 2. Inline code spans longer than 20 chars ────────────────────────────
  const inlineRegex = /`([^`\n]{20,})`/g;
  while ((match = inlineRegex.exec(text)) !== null) {
    blocks.push(match[1].trim());
  }

  // ── 3. Indented code blocks (4 spaces or tab) ────────────────────────────
  const indentedLines = [];
  let inIndented = false;
  for (const line of text.split("\n")) {
    if (/^( {4}|\t)/.test(line)) {
      indentedLines.push(line.replace(/^( {4}|\t)/, ""));
      inIndented = true;
    } else if (inIndented && line.trim() === "") {
      indentedLines.push("");
    } else if (inIndented) {
      const block = indentedLines.join("\n").trim();
      if (block) blocks.push(block);
      indentedLines.length = 0;
      inIndented = false;
    }
  }
  if (inIndented && indentedLines.length) {
    const block = indentedLines.join("\n").trim();
    if (block) blocks.push(block);
  }

  // ── 4. Fallback: treat the whole message as a code candidate if it looks
  //       like code (high density of brackets, semicolons, keywords) ─────────
  if (!blocks.length && looksLikeCode(text)) {
    blocks.push(text.trim());
  }

  return blocks.filter((b) => b.length > 10);
}

/**
 * looksLikeCode – heuristic to detect unformatted code pastes.
 * @param {string} text
 * @returns {boolean}
 */
function looksLikeCode(text) {
  const codeSignals = [
    /\bfunction\b/,
    /\bconst\b|\blet\b|\bvar\b/,
    /\bclass\b.*\{/,
    /\bdef\b.*:/,
    /\bpublic\s+(static\s+)?\w+\s+\w+\s*\(/,
    /[{};]\s*$/m,
  ];
  return codeSignals.filter((r) => r.test(text)).length >= 2;
}
