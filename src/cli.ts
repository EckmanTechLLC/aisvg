#!/usr/bin/env node
/**
 * AISVG CLI
 *
 * Interactive CLI for generating SVGs from text prompts using Claude AI
 */

import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { readFileSync, existsSync } from 'fs';
import { generateSvg, refineSvg } from './llm.js';
import { generateSvgMarkup } from './generator.js';
import { generateSemanticSvg, refineSemanticSvg } from './llm-semantic.js';
import { generateSemanticSvg as generateSemanticSvgMarkup } from './generator-semantic.js';
import { saveSvg, getLastSvg, type GenerationMode } from './storage.js';

// Load .env file if it exists
if (existsSync('.env')) {
  const envContent = readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

// Check for API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable not set');
  console.error('Please create a .env file or export ANTHROPIC_API_KEY=your_key');
  process.exit(1);
}

const rl = createInterface({ input, output });

/**
 * Main CLI loop
 */
async function main() {
  let currentMode: GenerationMode = 'coordinate';

  console.log('=== AISVG - AI-Powered SVG Generator ===\n');
  console.log('Commands:');
  console.log('  <description>    - Generate new SVG from description');
  console.log('  refine <text>    - Refine the last generated SVG');
  console.log('  mode <s|c>       - Switch mode: s=semantic, c=coordinate');
  console.log('  exit             - Exit the tool\n');
  console.log(`Current mode: ${currentMode}\n`);

  while (true) {
    const prompt = await rl.question(`[${currentMode}] > `);

    if (!prompt.trim()) {
      continue;
    }

    if (prompt.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      rl.close();
      process.exit(0);
    }

    // Handle mode switching
    if (prompt.toLowerCase().startsWith('mode ')) {
      const modeArg = prompt.slice(5).trim().toLowerCase();
      if (modeArg === 's' || modeArg === 'semantic') {
        currentMode = 'semantic';
        console.log('Switched to SEMANTIC mode\n');
      } else if (modeArg === 'c' || modeArg === 'coordinate') {
        currentMode = 'coordinate';
        console.log('Switched to COORDINATE mode\n');
      } else {
        console.log('Invalid mode. Use: mode s (semantic) or mode c (coordinate)\n');
      }
      continue;
    }

    try {
      // Check if this is a refinement request
      if (prompt.toLowerCase().startsWith('refine ')) {
        const refinementText = prompt.slice(7).trim();

        if (!refinementText) {
          console.log('Error: Please provide refinement instructions');
          continue;
        }

        const lastSvg = getLastSvg();
        if (!lastSvg) {
          console.log('Error: No previous SVG found to refine');
          continue;
        }

        console.log(`\nRefining: ${lastSvg.name} (using ${lastSvg.mode} mode)`);

        // Use the same mode as the last generation
        if (lastSvg.mode === 'semantic') {
          const spec = await refineSemanticSvg(lastSvg.spec as any, refinementText);
          const svgMarkup = generateSemanticSvgMarkup(spec);
          const filepath = saveSvg(svgMarkup, spec, `refine: ${refinementText}`, 'semantic');

          console.log(`\nSuccess! SVG saved to: ${filepath}`);
          console.log(`Layers: ${spec.layers.length}`);
          console.log(`Description: ${spec.description}\n`);
        } else {
          const spec = await refineSvg(lastSvg.spec as any, refinementText);
          const svgMarkup = generateSvgMarkup(spec);
          const filepath = saveSvg(svgMarkup, spec, `refine: ${refinementText}`, 'coordinate');

          console.log(`\nSuccess! SVG saved to: ${filepath}`);
          console.log(`Layers: ${spec.layers.length}`);
          console.log(`Description: ${spec.description}\n`);
        }
      } else {
        // Generate new SVG using current mode
        console.log(`\nGenerating SVG (${currentMode} mode)...`);

        if (currentMode === 'semantic') {
          const spec = await generateSemanticSvg(prompt);
          const svgMarkup = generateSemanticSvgMarkup(spec);
          const filepath = saveSvg(svgMarkup, spec, prompt, 'semantic');

          console.log(`\nSuccess! SVG saved to: ${filepath}`);
          console.log(`Layers: ${spec.layers.length}`);
          console.log(`Description: ${spec.description}\n`);
        } else {
          const spec = await generateSvg(prompt);
          const svgMarkup = generateSvgMarkup(spec);
          const filepath = saveSvg(svgMarkup, spec, prompt, 'coordinate');

          console.log(`\nSuccess! SVG saved to: ${filepath}`);
          console.log(`Layers: ${spec.layers.length}`);
          console.log(`Description: ${spec.description}\n`);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`\nError: ${error.message}\n`);
      } else {
        console.error(`\nUnexpected error: ${error}\n`);
      }
    }
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
