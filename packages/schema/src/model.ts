// SPDX-License-Identifier: Apache-2.0
import { z } from 'zod';
import rawModel from '../content-model.json' with { type: 'json' };

/** A cross-field invariant: when one field equals a value, another must be in a set. */
export interface BoundaryRule {
  when: { field: string; equals: string };
  require: { field: string; in: string[] };
}

/**
 * The SSOT content model. Drives the Zod schema AND the gates so the two can
 * never drift. Domain-neutral — extend `enums`/`required` per deployment, but
 * never re-declare these values inline elsewhere.
 */
export interface ContentModel {
  required: string[];
  enums: Record<string, string[]>;
  dates: string[];
  reviewedRequires: string[];
  boundary: BoundaryRule[];
}

export const CONTENT_MODEL: ContentModel = {
  required: rawModel.required,
  enums: rawModel.enums,
  dates: rawModel.dates,
  reviewedRequires: rawModel.reviewedRequires,
  boundary: (rawModel.boundary ?? []) as BoundaryRule[],
};

/**
 * Zod schema for the SSOT content model — used by `nema doctor` to validate a
 * custom `contentModel` (or the bundled default) before the gates consume it.
 * Structural only; cross-reference checks (e.g. a boundary that points at an
 * undeclared field) live in the doctor.
 */
export const ContentModelSchema = z.object({
  required: z.array(z.string().min(1)).min(1),
  enums: z.record(z.array(z.string().min(1)).min(1)),
  dates: z.array(z.string().min(1)),
  reviewedRequires: z.array(z.string().min(1)),
  boundary: z
    .array(
      z.object({
        when: z.object({ field: z.string().min(1), equals: z.string().min(1) }),
        require: z.object({ field: z.string().min(1), in: z.array(z.string().min(1)).min(1) }),
      }),
    )
    .default([]),
});
