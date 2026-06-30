// SPDX-License-Identifier: Apache-2.0
import { tokenize } from './search.js';
import type { Page } from './types.js';

/**
 * Content similarity over the corpus — the substrate behind duplicate detection
 * and "is there already a page like this?". It reuses the same linear tokenizer
 * as search and scores pages by TF-IDF cosine: a term counts more when it is
 * rare across the corpus, so two pages are "similar" when they share the
 * distinctive vocabulary that defines a topic, not just common filler words.
 */

/** A page ranked by its similarity to a target (or query text). */
export interface SimilarPage {
  path: string;
  title: string;
  /** Cosine similarity in [0, 1], rounded to 4 dp. */
  score: number;
}

/** An unordered pair of pages whose content is near-identical. */
export interface DuplicatePair {
  a: string;
  b: string;
  score: number;
}

interface Vector {
  weights: Map<string, number>;
  norm: number;
}

export interface SimilarityIndex {
  vectors: Map<string, Vector>;
  idf: (term: string) => number;
}

/** Term frequencies for a page, with the title weighted (counted twice) like search. */
function termFreq(title: string, body: string): Map<string, number> {
  const tf = new Map<string, number>();
  for (const tok of tokenize(`${title} ${title} ${body}`)) {
    tf.set(tok, (tf.get(tok) ?? 0) + 1);
  }
  return tf;
}

/** Build a TF-IDF vector for one term-frequency map against a corpus `idf`. */
function vectorize(tf: Map<string, number>, idf: (term: string) => number): Vector {
  const weights = new Map<string, number>();
  let sumSq = 0;
  for (const [term, f] of tf) {
    const w = (1 + Math.log(f)) * idf(term); // log-scaled tf · idf
    weights.set(term, w);
    sumSq += w * w;
  }
  return { weights, norm: Math.sqrt(sumSq) || 1 };
}

/** Cosine similarity of two TF-IDF vectors (iterating the smaller for speed). */
function cosine(a: Vector, b: Vector): number {
  const [small, large] = a.weights.size <= b.weights.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [term, w] of small.weights) {
    const w2 = large.weights.get(term);
    if (w2 !== undefined) dot += w * w2;
  }
  return dot / (a.norm * b.norm);
}

/** Build a reusable TF-IDF index over the corpus (smoothed idf). */
export function buildSimilarityIndex(pages: Page[]): SimilarityIndex {
  const n = pages.length || 1;
  const df = new Map<string, number>();
  const tfs = pages.map((p) => ({ path: p.path, tf: termFreq(p.title, p.body) }));
  for (const { tf } of tfs) {
    for (const term of tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const idf = (term: string): number => Math.log((n + 1) / ((df.get(term) ?? 0) + 1)) + 1;

  const vectors = new Map<string, Vector>();
  for (const { path, tf } of tfs) vectors.set(path, vectorize(tf, idf));
  return { vectors, idf };
}

export interface SimilarOptions {
  /** Max results (default 5). */
  limit?: number;
  /** Drop results scoring at or below this (default 0). */
  minScore?: number;
}

function rank(
  vectors: Map<string, Vector>,
  target: Vector,
  pages: Page[],
  skipPath: string | null,
  opts: SimilarOptions,
): SimilarPage[] {
  const limit = opts.limit ?? 5;
  const minScore = opts.minScore ?? 0;
  const titleOf = new Map(pages.map((p) => [p.path, p.title]));
  const out: SimilarPage[] = [];
  for (const [path, vec] of vectors) {
    if (path === skipPath) continue;
    const score = cosine(target, vec);
    if (score <= minScore) continue;
    out.push({ path, title: titleOf.get(path) ?? path, score: Number(score.toFixed(4)) });
  }
  out.sort((x, y) => y.score - x.score);
  return out.slice(0, limit);
}

/** The pages most similar to an existing page. Empty if the path is unknown. */
export function findSimilar(
  pages: Page[],
  targetPath: string,
  opts: SimilarOptions = {},
): SimilarPage[] {
  const index = buildSimilarityIndex(pages);
  const target = index.vectors.get(targetPath);
  if (!target) return [];
  return rank(index.vectors, target, pages, targetPath, opts);
}

/**
 * The existing pages most similar to free text (a title + body an agent is about
 * to draft). Lets a producer ask "does this already exist?" *before* writing a
 * duplicate. Scored against the current corpus's idf.
 */
export function findSimilarToText(
  pages: Page[],
  text: { title?: string; body: string },
  opts: SimilarOptions = {},
): SimilarPage[] {
  const index = buildSimilarityIndex(pages);
  const target = vectorize(termFreq(text.title ?? '', text.body), index.idf);
  return rank(index.vectors, target, pages, null, opts);
}

/**
 * All page pairs whose similarity meets `threshold` — candidate duplicates.
 * Each unordered pair is reported once, highest score first.
 */
export function nearDuplicates(pages: Page[], threshold: number): DuplicatePair[] {
  const { vectors } = buildSimilarityIndex(pages);
  const paths = pages.map((p) => p.path);
  const out: DuplicatePair[] = [];
  for (let i = 0; i < paths.length; i++) {
    const a = vectors.get(paths[i]!)!;
    for (let j = i + 1; j < paths.length; j++) {
      const score = cosine(a, vectors.get(paths[j]!)!);
      if (score >= threshold)
        out.push({ a: paths[i]!, b: paths[j]!, score: Number(score.toFixed(4)) });
    }
  }
  out.sort((x, y) => y.score - x.score);
  return out;
}
