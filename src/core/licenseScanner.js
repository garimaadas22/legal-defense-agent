/**
 * core/licenseScanner.js
 *
 * Screens extracted code blocks against the license fingerprint database.
 * Returns a structured ScanResult object consumed by the prompt builder
 * and chat handler.
 */

import { LICENSE_DATABASE, getRiskColor } from "../data/licenseDatabase.js";

/**
 * @typedef {Object} Violation
 * @property {string} id
 * @property {string} license
 * @property {string} risk
 * @property {string} description
 * @property {string} refactorHint
 * @property {string} snippet  – the first 80 chars of the matched code block
 */

/**
 * @typedef {Object} ScanResult
 * @property {boolean} hasViolations
 * @property {boolean} hasCode        – was any code found at all?
 * @property {Violation[]} violations
 * @property {string} summary         – one-line human summary
 */

/**
 * scanCodeForLicenseIssues
 * @param {string[]} codeBlocks – raw code strings extracted from the message
 * @returns {ScanResult}
 */
export function scanCodeForLicenseIssues(codeBlocks) {
  if (!codeBlocks.length) {
    return {
      hasViolations: false,
      hasCode: false,
      violations: [],
      summary: "No code blocks found in this message.",
    };
  }

  /** @type {Violation[]} */
  const violations = [];

  for (const block of codeBlocks) {
    for (const entry of LICENSE_DATABASE) {
      const matched = entry.patterns.some((pattern) => pattern.test(block));
      if (matched) {
        // Avoid duplicate entries for the same rule across multiple blocks
        if (!violations.some((v) => v.id === entry.id)) {
          violations.push({
            id: entry.id,
            license: entry.license,
            risk: entry.risk,
            description: entry.description,
            refactorHint: entry.refactorHint,
            snippet: block.slice(0, 80).replace(/\n/g, " "),
            badge: getRiskColor(entry.risk),
          });
        }
      }
    }
  }

  // Sort by risk severity: critical → high → medium → low
  const RISK_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
  violations.sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk]);

  const summary = violations.length
    ? `Found ${violations.length} potential violation(s): ${violations
        .map((v) => `${v.badge} ${v.license}`)
        .join(", ")}`
    : "✅ No known license violations detected in submitted code.";

  return {
    hasViolations: violations.length > 0,
    hasCode: true,
    violations,
    summary,
  };
}
