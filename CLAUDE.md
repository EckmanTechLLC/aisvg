# CLAUDE.md - AISVG Development Standards

**🔴 CRITICAL: READ THIS FILE AT START OF EVERY SESSION**

## PROJECT PHILOSOPHY
- **KISS**: Keep It Simple Stupid - personal project, not enterprise-grade
- Single user, local CLI tool - no web interface needed
- Storage is cheap - save all generated SVGs with metadata
- Iterate fast, add features as needed

## PROJECT PURPOSE
Generate SVGs from text prompts using Claude's structured output. The key concept: SVGs are **layers of primitive shapes** (circles, rectangles, polygons, etc.) that combine to create complex images (valves, tanks, pumps, diagrams, etc.).

## TECH STACK
- **Runtime**: Node.js 20+ with TypeScript
- **LLM**: Claude API (Anthropic) with structured JSON output
- **CLI**: Simple interactive terminal interface
- **SVG Generation**: Custom JSON-to-SVG engine
- **Storage**: Local filesystem (./diagrams/ directory)

## HOW IT WORKS
1. User enters description via CLI (e.g., "a centrifugal pump with inlet/outlet")
2. Send prompt to Claude API requesting structured JSON response
3. Claude returns JSON describing layers/shapes/positions (NOT raw SVG)
4. Tool generates actual SVG from JSON specification
5. Save SVG to diagrams folder with timestamp and description

## GENERATION MODES

### Coordinate Mode (default)
Claude specifies exact coordinates for shapes:
```json
{
  "name": "ball_valve",
  "layers": [
    {"type": "polygon", "props": {"points": "100,150 150,125 150,175"}}
  ]
}
```

### Semantic Mode
Claude describes relationships, generator calculates coordinates:
```json
{
  "name": "ball_valve_isa",
  "layers": [
    {
      "shape": {"shapeType": "triangle", "orientation": "pointing_right", "size": 100},
      "position": {"type": "relative", "relativeTo": "center_circle", "alignment": "tip_touches_left"}
    }
  ]
}
```

**Use semantic mode for:** Standard symbols (ISA, P&ID) with geometric relationships
**Use coordinate mode for:** Creative images, complex organic shapes

## SUPPORTED SHAPE TYPES
**Coordinate mode:** rect, circle, ellipse, line, polyline, polygon, **path**, **text**
**Semantic mode:** triangle, rectangle, circle, ellipse, line, diamond

## MANDATORY PRE-IMPLEMENTATION CHECKLIST
When asked to modify/create code:

1. **STOP** - Do not implement anything yet
2. **READ** existing related files first
3. **VERIFY** current patterns and structures
4. **PROPOSE** changes concisely (no code examples in proposals)
5. **WAIT** for approval
6. **IMPLEMENT** after approval

## DEVELOPMENT WORKFLOW RULES
- **NEVER install dependencies via npm/pnpm** - User handles this themselves
- **NEVER run the CLI tool or execute TypeScript** - User runs all commands
- **NEVER run tests** - User handles all testing
- **NEVER create documentation files unless explicitly requested**
- **NEVER include timelines or schedules** in plans or proposals
- **You write code ONLY** - User handles all execution
- **PROVIDE instructions** - Tell user what commands to run, but don't run them yourself
- **BE CONCISE** - No verbose explanations or code examples in design docs

## FEATURES
### Core
- **Hybrid generation modes:** Switch between coordinate and semantic approaches
- Generate SVG from text prompt
- Save to diagrams folder with metadata
- Support iterative refinement (refine existing SVG)

### Generation Modes
- **Coordinate mode (c):** LLM specifies exact coordinates - best for creative images
- **Semantic mode (s):** LLM describes relationships - best for standard symbols
- **Mode switching:** `mode s` or `mode c` in CLI
- **Mode persistence:** Refinements use same mode as original generation

### Shape Support
- **Coordinate mode:** rect, circle, ellipse, line, polyline, polygon, path (with curves), text (labels)
- **Semantic mode:** triangle, rectangle, circle, ellipse, line, diamond (with semantic positioning)
- Layered composition (order matters for z-index)
- Standard SVG attributes: fill, stroke, stroke-width, opacity, transform
- **Path support:** Complex curves with SVG path data (M, L, C, Q, A, Z commands)
- **Text support:** Labels with fontSize, fontFamily, textAnchor

### Iterative Refinement
- "refine" command improves last generated SVG
- Automatically uses same mode as original
- Preserves generation context for better results

## FILE STRUCTURE
```
aisvg/
├── src/
│   ├── cli.ts                  # CLI interface with mode switching
│   ├── llm.ts                  # Coordinate mode: LLM API client
│   ├── generator.ts            # Coordinate mode: JSON-to-SVG engine
│   ├── schema.ts               # Coordinate mode: TypeScript types
│   ├── llm-semantic.ts         # Semantic mode: LLM API client
│   ├── generator-semantic.ts   # Semantic mode: Semantic-to-SVG engine
│   ├── schema-semantic.ts      # Semantic mode: TypeScript types
│   └── storage.ts              # File saving with mode tracking
├── diagrams/                   # Generated SVGs (gitignored)
├── .env                        # API keys (gitignored)
├── package.json
├── tsconfig.json
└── CLAUDE.md                   # This file
```

## ASSUMPTION VIOLATIONS = UPDATE THIS FILE
If user corrects you for making assumptions:
- Immediately update this CLAUDE.md file with the specific rule
- Add the mistake to "Past Mistakes" section below

## PAST MISTAKES
1. **Output folder naming** - Initially used `./output/` but user wants `./diagrams/` for SVG storage
2. **Forbidding path shapes** - Initially tried to forbid SVG paths, but they're fundamental and should be supported
3. **Single approach assumption** - Initially only had coordinate mode, but semantic mode is better for standard symbols
