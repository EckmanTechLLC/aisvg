/**
 * LLM Client for Semantic SVG Generation
 *
 * LLM describes shapes semantically (what + relationships)
 * Generator calculates exact coordinates
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { SemanticSvgSpec } from './schema-semantic.js';

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

const SYSTEM_PROMPT = `You are an expert at describing SVG graphics using SEMANTIC shape descriptions.

CRITICAL: You do NOT specify exact coordinates. Instead, you describe:
- WHAT shapes are needed
- HOW they relate to each other
- WHERE they should be positioned (semantically)

The generator will calculate exact coordinates to make your descriptions reality.

## Shape Types Available:
- triangle (equilateral, isosceles, right)
- rectangle
- circle
- ellipse
- line
- diamond (rotated square)

## Orientation Options:
- Triangles: pointing_up, pointing_down, pointing_left, pointing_right

## Position Types:
1. "centered" - shape centered on canvas
2. "absolute" - specific x,y coordinates (use sparingly)
3. "relative" - positioned relative to another shape using alignment

## Alignment Options (for relative positioning):
- tip_touches_left / tip_touches_right - triangle tip touches referenced shape
- edge_touches_left / edge_touches_right - shape edge touches referenced shape
- center_aligned - centers match
- adjacent_left / adjacent_right - placed next to referenced shape

## CRITICAL - For Standard Symbols:
**ISA Ball Valve:** Two equilateral triangles with tips touching a center circle
- Triangle 1: pointing_right, tip_touches_left of center circle
- Circle: centered
- Triangle 2: pointing_left, tip_touches_right of center circle

## Example JSON Format:
{
  "name": "ball_valve_isa",
  "description": "ISA standard ball valve symbol",
  "canvasSize": {"width": 400, "height": 400},
  "layers": [
    {
      "id": "left_triangle",
      "shape": {
        "shapeType": "triangle",
        "triangleType": "equilateral",
        "orientation": "pointing_right",
        "size": 100
      },
      "position": {
        "type": "relative",
        "relativeTo": "center_circle",
        "alignment": "tip_touches_left"
      },
      "style": {"fill": "none", "stroke": "#000", "strokeWidth": 2}
    },
    {
      "id": "center_circle",
      "shape": {"shapeType": "circle", "radius": 30},
      "position": {"type": "centered"},
      "style": {"fill": "none", "stroke": "#000", "strokeWidth": 2}
    },
    {
      "id": "right_triangle",
      "shape": {
        "shapeType": "triangle",
        "triangleType": "equilateral",
        "orientation": "pointing_left",
        "size": 100
      },
      "position": {
        "type": "relative",
        "relativeTo": "center_circle",
        "alignment": "tip_touches_right"
      },
      "style": {"fill": "none", "stroke": "#000", "strokeWidth": 2}
    }
  ]
}

Respond with ONLY the JSON - no markdown, no explanation.`;

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

export async function generateSemanticSvg(prompt: string): Promise<SemanticSvgSpec> {
  console.log(`Using ${getLLMProvider().toUpperCase()} with SEMANTIC approach...`);
  console.log('Generating semantic specification...');

  const generatePrompt = `Create a semantic SVG specification for: ${prompt}

Remember:
- Describe shapes and their relationships
- Use relative positioning with alignment
- Let the generator calculate exact coordinates
- For standard symbols (ISA, etc.), recall the correct shape relationships`;

  const jsonText = await callLLM(generatePrompt, SYSTEM_PROMPT);

  console.log('\n=== LLM Response ===');
  console.log(jsonText.substring(0, 500) + '...');
  console.log('====================\n');

  const text = jsonText.trim();
  const spec = JSON.parse(text) as SemanticSvgSpec;

  console.log(`Generated: ${spec.name}`);
  console.log(`Layers: ${spec.layers.length}`);

  return spec;
}

export async function refineSemanticSvg(
  previousSpec: SemanticSvgSpec,
  refinementPrompt: string
): Promise<SemanticSvgSpec> {
  console.log('Refining semantic specification...');

  const prompt = `Here is the current semantic specification:

${JSON.stringify(previousSpec, null, 2)}

Modify it based on this request: ${refinementPrompt}

Respond with the complete updated specification.`;

  return generateSemanticSvg(prompt);
}
