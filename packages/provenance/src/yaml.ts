// SPDX-License-Identifier: Apache-2.0
import { JSON_SCHEMA, dump, load } from 'js-yaml';

/** gray-matter options that keep frontmatter values primitive (dates stay strings). */
export const MATTER_OPTIONS = {
  engines: {
    yaml: (input: string): object => (load(input, { schema: JSON_SCHEMA }) as object) ?? {},
  },
} as const;

/** Serialize a frontmatter object to YAML with no line-wrapping and stable key order. */
export function dumpFrontmatter(data: Record<string, unknown>): string {
  return dump(data, { lineWidth: -1, noRefs: true, sortKeys: false, schema: JSON_SCHEMA });
}
