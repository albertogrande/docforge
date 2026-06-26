// SPDX-License-Identifier: Apache-2.0

/** Severity of a `nema doctor` check. */
export type Level = 'ok' | 'warn' | 'error';

export interface Check {
  level: Level;
  label: string;
  /** Optional remediation, printed indented under the check. */
  fix?: string;
}

export const MARK: Record<Level, string> = { ok: '✓', warn: '⚠', error: '✗' };
