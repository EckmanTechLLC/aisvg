/**
 * LLM API Client
 *
 * Handles communication with LLM APIs (OpenAI or Anthropic)
 * to get JSON specifications for SVG generation.
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { SvgSpec } from './schema.js';

function getLLMProvider() {
  return process.env.LLM_PROVIDER || 'anthropic';
}

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const OPENAI_MODEL = 'gpt-4o';

// System prompt that teaches the LLM how to think about SVGs as layers
const SYSTEM_PROMPT = `You are an expert at creating SVG graphics using primitive shapes.

CRITICAL DISTINCTION:
- If the request is for a STANDARDIZED symbol, diagram, or icon (ISA symbols, P&ID symbols, electrical diagrams, common technical symbols, road signs, etc.), you must RECALL and REPRODUCE the exact standard representation. Do NOT interpret creatively - replicate the established standard accurately.
- If the request is for a creative/artistic image (animals, objects, scenes), then design and interpret creatively.

When creating an SVG, you must:
1. Break down the image into layers of primitive shapes (rect, circle, ellipse, line, polyline, polygon)
2. For standards: recall the exact symbol specification. For creative: think about what shapes combine to create the object
3. Consider orientation, positioning, and layering order (bottom to top)
4. Use appropriate colors, strokes, and fills to achieve the desired look

Key principles:
- Simple shapes combine to create complex images
- Layer order matters (first layer = bottom, last = top)
- Use standard SVG colors (named colors or hex)
- Keep coordinates reasonable (viewBox typically 0-500 range)
- Add descriptive IDs to each layer for clarity

CRITICAL - Shape Geometry Examples:
- Triangle pointing right: {"type": "polygon", "props": {"points": "100,150 150,125 150,175"}}
- Triangle pointing left: {"type": "polygon", "props": {"points": "150,150 100,125 100,175"}}
- Triangle pointing up: {"type": "polygon", "props": {"points": "150,100 125,150 175,150"}}
- Triangle pointing down: {"type": "polygon", "props": {"points": "150,150 125,100 175,100"}}
- Trapezoid (tapered pipe): {"type": "polygon", "props": {"points": "100,140 150,130 150,170 100,160"}}
- Pentagon: {"type": "polygon", "props": {"points": "150,100 180,130 165,165 135,165 120,130"}}
- Horizontal pipe: {"type": "rect", "props": {"x": 100, "y": 140, "width": 100, "height": 20}}
- Vertical pipe: {"type": "rect", "props": {"x": 140, "y": 100, "width": 20, "height": 100}}

IMPORTANT: A polygon needs at least 3 points for a triangle, 4 for a quadrilateral, etc. Each point is "x,y" and points are space-separated. "100,150 150,125 150,175" is 3 points = triangle. "50,180 50,220 150,220 150,180" is 4 points = rectangle, NOT a triangle!

Supported shape types:
- rect: Rectangles (with optional rounded corners via rx, ry)
- circle: Circles
- ellipse: Ellipses
- line: Straight lines
- polyline: Connected line segments
- polygon: Closed polygons
- path: Complex shapes with curves (use d attribute with SVG path commands: M, L, C, Q, A, Z)
- text: Labels and annotations (use text property for content, fontSize, textAnchor, etc.)

You must respond with ONLY a JSON object in this exact format (no markdown, no explanation, just the raw JSON):
{
  "name": "short_identifier_snake_case",
  "description": "Full description of what this represents",
  "viewBox": {
    "width": 400,
    "height": 400,
    "minX": 0,
    "minY": 0
  },
  "layers": [
    {
      "id": "layer_id",
      "type": "rect|circle|ellipse|line|polyline|polygon|path|text",
      "props": {
        "fill": "#color",
        "stroke": "#color",
        "strokeWidth": 2,
        ...shape-specific properties
      },
      "description": "optional description"
    }
  ]
}

Shape-specific properties:
- rect: x, y, width, height, rx (optional), ry (optional)
- circle: cx, cy, r
- ellipse: cx, cy, rx, ry
- line: x1, y1, x2, y2
- polyline/polygon: points (space-separated x,y pairs)
- path: d (SVG path data like "M 10,10 L 90,90 C 100,100 150,150 200,200 Z")
- text: x, y, text (content), fontSize (optional), fontFamily (optional), textAnchor (optional)`;

/**
 * Call LLM with a prompt and return text response
 */
async function callLLM(prompt: string, systemPrompt?: string): Promise<string> {
  if (getLLMProvider() === 'openai') {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await getOpenAIClient().chat.completions.create({
      model: OPENAI_MODEL,
      messages,
    });

    return response.choices[0]?.message?.content || '';
  } else {
    // Anthropic
    const response = await getAnthropicClient().messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: systemPrompt || '',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }
    return content.text;
  }
}

/**
 * Generate SVG specification from a text prompt
 * Uses two-step process: research then generate
 */
export async function generateSvg(prompt: string): Promise<SvgSpec> {
  console.log(`Using ${getLLMProvider().toUpperCase()} provider...`);
  console.log('Analyzing request...');

  // Step 1: Research
  const researchPrompt = `Analyze this request: "${prompt}"

First, determine if this is:
A) A standardized symbol/diagram (ISA, P&ID, electrical, technical standard, etc.)
B) A creative/artistic image

Then describe the key visual elements and geometric features:
- For standards: recall the EXACT standard specification (which shapes, dimensions, orientations)
- For creative: describe what shapes would best represent this

Be specific about geometry and cite the standard if applicable.`;

  const visualDescription = await callLLM(researchPrompt);

  console.log('\n=== Research Output ===');
  console.log(visualDescription);
  console.log('======================\n');
  console.log('Generating SVG...');

  // Step 2: Generate
  const generatePrompt = `Based on this visual analysis:

${visualDescription}

Now generate the SVG JSON specification for: ${prompt}`;

  const jsonText = await callLLM(generatePrompt, SYSTEM_PROMPT);

  // Parse JSON from response (strip markdown if present)
  let text = jsonText.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
  }
  const spec = JSON.parse(text) as SvgSpec;

  console.log(`Generated specification: ${spec.name}`);
  console.log(`Layers: ${spec.layers.length}`);

  return spec;
}

/**
 * Refine an existing SVG specification based on feedback
 */
export async function refineSvg(
  previousSpec: SvgSpec,
  refinementPrompt: string
): Promise<SvgSpec> {
  console.log('Sending refinement request...');

  const prompt = `Here is the current SVG specification:

${JSON.stringify(previousSpec, null, 2)}

Please modify it based on this request: ${refinementPrompt}

Respond with the complete updated specification.`;

  return generateSvg(prompt);
}
