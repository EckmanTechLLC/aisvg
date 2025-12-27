/**
 * Storage utilities
 *
 * Handles saving SVGs and metadata to the diagrams folder
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { SvgSpec } from './schema.js';
import type { SemanticSvgSpec } from './schema-semantic.js';

const OUTPUT_DIR = './diagrams';
const METADATA_FILE = join(OUTPUT_DIR, 'metadata.json');

export type GenerationMode = 'coordinate' | 'semantic';

// Metadata for tracking generated SVGs
export interface SvgMetadata {
  timestamp: string;
  filename: string;
  name: string;
  description: string;
  prompt: string;
  mode: GenerationMode;
  spec: SvgSpec | SemanticSvgSpec;
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir(): void {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Load all metadata
 */
function loadMetadata(): SvgMetadata[] {
  if (!existsSync(METADATA_FILE)) {
    return [];
  }
  const content = readFileSync(METADATA_FILE, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save metadata
 */
function saveMetadata(metadata: SvgMetadata[]): void {
  writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

/**
 * Save SVG and metadata
 */
export function saveSvg(
  svgMarkup: string,
  spec: SvgSpec | SemanticSvgSpec,
  prompt: string,
  mode: GenerationMode
): string {
  ensureOutputDir();

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const filename = `${spec.name}_${timestamp}.svg`;
  const filepath = join(OUTPUT_DIR, filename);

  // Save SVG file
  writeFileSync(filepath, svgMarkup);

  // Update metadata
  const metadata = loadMetadata();
  metadata.push({
    timestamp: new Date().toISOString(),
    filename,
    name: spec.name,
    description: spec.description,
    prompt,
    mode,
    spec,
  });
  saveMetadata(metadata);

  return filepath;
}

/**
 * Get the most recent SVG metadata (for refinement)
 */
export function getLastSvg(): SvgMetadata | null {
  const metadata = loadMetadata();
  return metadata.length > 0 ? metadata[metadata.length - 1] : null;
}
