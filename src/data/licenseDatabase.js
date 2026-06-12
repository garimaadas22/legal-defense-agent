/**
 * data/licenseDatabase.js
 *
 * Mock compliance database of known license fingerprints.
 *
 * In production this would be backed by:
 *   - A vector DB of embedded code snippets (e.g. pgvector / Qdrant)
 *   - SPDX license identifiers
 *   - Real TLDR-Legal / FOSSA API data
 *
 * For the hackathon we use pattern matching on structural signatures,
 * algorithm names, and recognisable idioms found in well-known OSS.
 *
 * Each entry:
 *   id          – unique identifier
 *   license     – SPDX licence expression
 *   risk        – "critical" | "high" | "medium" | "low"
 *   description – human-readable what this pattern matches
 *   patterns    – array of RegExp to test against submitted code
 *   refactorHint – instruction for the LLM refactor prompt
 */

export const LICENSE_DATABASE = [
  // ── GPL-2.0 / GPL-3.0 ─────────────────────────────────────────────────────
  {
    id: "gpl-linux-list",
    license: "GPL-2.0-only",
    risk: "critical",
    description: "Linux kernel linked-list macro pattern (list_head / LIST_HEAD_INIT)",
    patterns: [
      /list_head/i,
      /LIST_HEAD_INIT/,
      /list_for_each_entry\s*\(/,
    ],
    refactorHint:
      "Replace with a generic doubly-linked list using plain struct pointers. Do not use the Linux list_head API.",
  },
  {
    id: "gpl-wordpress-hooks",
    license: "GPL-2.0-or-later",
    risk: "critical",
    description: "WordPress action/filter hook system (add_action / apply_filters pattern)",
    patterns: [
      /add_action\s*\(\s*['"`]/,
      /apply_filters\s*\(\s*['"`]/,
      /do_action\s*\(\s*['"`]/,
    ],
    refactorHint:
      "Implement a generic EventEmitter or pub/sub pattern without WordPress-specific function names.",
  },
  {
    id: "gpl-ffmpeg-av",
    license: "GPL-2.0-or-later",
    risk: "critical",
    description: "FFmpeg AVCodec / AVFormatContext API usage",
    patterns: [
      /avcodec_open2\s*\(/,
      /av_read_frame\s*\(/,
      /avformat_open_input\s*\(/,
    ],
    refactorHint:
      "Wrap media operations behind an abstract MediaDecoder interface. Reference only public platform APIs.",
  },

  // ── LGPL ──────────────────────────────────────────────────────────────────
  {
    id: "lgpl-glibc-getopt",
    license: "LGPL-2.1-only",
    risk: "high",
    description: "GNU getopt_long argument parsing idiom",
    patterns: [
      /getopt_long\s*\(/,
      /struct\s+option\s+long_options\s*\[/,
    ],
    refactorHint:
      "Use a clean argument parsing library (e.g. minimist / yargs / argparse) instead of the GNU getopt_long pattern.",
  },

  // ── AGPL ──────────────────────────────────────────────────────────────────
  {
    id: "agpl-mongodb-driver",
    license: "SSPL-1.0",
    risk: "critical",
    description: "MongoDB SSPL – direct driver cursor/session management pattern",
    patterns: [
      /MongoClient\.connect\s*\(/,
      /db\.collection\s*\(\s*['"`]\w/,
      /\.find\(\{\s*\}\)\.toArray/,
    ],
    refactorHint:
      "Abstract database access behind a repository interface. The concrete driver call should be isolated in an infrastructure layer, not inline business logic.",
  },

  // ── MIT / Permissive (low risk – informational only) ─────────────────────
  {
    id: "mit-lodash-deepclone",
    license: "MIT",
    risk: "low",
    description: "Lodash _.cloneDeep pattern reimplemented inline",
    patterns: [
      /JSON\.parse\s*\(\s*JSON\.stringify\s*\(/,
    ],
    refactorHint:
      "MIT is permissive; no refactor required. Optionally use structuredClone() (Node ≥17) for a native deep-clone.",
  },

  // ── Apache-2.0 (patent clause – flag for legal review) ───────────────────
  {
    id: "apache-lucene-scorer",
    license: "Apache-2.0",
    risk: "medium",
    description: "Apache Lucene TF-IDF / BM25 scoring function signature",
    patterns: [
      /\btf\s*\*\s*idf\b/i,
      /\bBM25\b/,
      /termFrequency\s*[\/*]/,
    ],
    refactorHint:
      "Apache-2.0 allows use but requires NOTICE file attribution. Ensure your NOTICE file credits Apache Lucene if you retain this algorithm.",
  },

  // ── Proprietary / known copyright ─────────────────────────────────────────
  {
    id: "prop-oracle-java-sort",
    license: "PROPRIETARY",
    risk: "critical",
    description: "Oracle Java TimSort internals (runBase / runLen array naming convention)",
    patterns: [
      /runBase\s*=\s*new\s+int/,
      /runLen\s*=\s*new\s+int/,
      /mergeLo\s*\(/,
      /mergeHi\s*\(/,
    ],
    refactorHint:
      "Rewrite using a standard merge-sort or use the language runtime's built-in sort. Avoid Oracle-specific internal naming.",
  },
  {
    id: "prop-react-fiber-internals",
    license: "MIT",   // React itself is MIT but reproducing internals is risky
    risk: "medium",
    description: "React Fiber internal structure (fiberNode / pendingProps / memoizedState naming)",
    patterns: [
      /fiberNode\s*[=:]/,
      /pendingProps\s*[=:]/,
      /memoizedState\s*[=:]/,
      /\balternate\s*[=:]\s*null/,
    ],
    refactorHint:
      "Avoid mirroring React's internal fiber object shape. Use the public React API (hooks, context) instead.",
  },
];

/**
 * getRiskColor – emoji badge for risk level (used in chat output).
 */
export function getRiskColor(risk) {
  return { critical: "🔴", high: "🟠", medium: "🟡", low: "🟢" }[risk] ?? "⚪";
}
