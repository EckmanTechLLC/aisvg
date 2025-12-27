# AISVG - AI-Powered SVG Generator

A CLI tool that generates SVGs from text prompts using AI (Claude/OpenAI). Features **two generation modes**: coordinate-based for creative images and semantic-based for standard symbols.

## Key Features

- **Hybrid Generation Modes**: Switch between coordinate and semantic approaches
- **Coordinate Mode**: LLM specifies exact coordinates - best for creative/organic shapes
- **Semantic Mode**: LLM describes relationships - best for standard symbols (ISA, P&ID)
- **8 Shape Types**: rect, circle, ellipse, line, polyline, polygon, path (curves), text (labels)
- **Iterative Refinement**: Improve generated SVGs with natural language feedback
- **Persistent History**: All SVGs saved with metadata for reproducibility

## How It Works

### Coordinate Mode (default)
1. You describe what you want (e.g., "a mouse with round ears")
2. LLM calculates exact coordinates for each shape
3. Tool generates SVG markup from coordinate-based JSON
4. Perfect for creative images with organic shapes

### Semantic Mode
1. You describe what you want (e.g., "ISA ball valve symbol")
2. LLM describes shape relationships (e.g., "triangle tip touches circle")
3. Generator calculates exact coordinates from semantic description
4. Perfect for standard symbols with precise geometric relationships

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set your Anthropic API key:
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

3. Build the project:
```bash
npm run build
```

## Usage

Run the CLI:
```bash
npm run dev
```

### Commands

- **Switch mode**: `mode s` (semantic) or `mode c` (coordinate)
  ```
  [coordinate] > mode s
  Switched to SEMANTIC mode
  ```

- **Generate new SVG**: Just type your description
  ```
  [semantic] > ISA ball valve symbol
  [coordinate] > a cute mouse with round ears
  ```

- **Refine last SVG**: Use the `refine` command (automatically uses same mode)
  ```
  [semantic] > refine fill in the circle
  [coordinate] > refine make ears bigger and add whiskers
  ```

- **Exit**: Type `exit`

### When to Use Each Mode

**Coordinate Mode (c)** - Default
- Creative/artistic images
- Animals, objects, scenes
- Organic shapes needing curves
- Complex illustrations

**Semantic Mode (s)**
- Standard technical symbols
- ISA, P&ID, electrical diagrams
- Geometric compositions
- Shapes with precise relationships

## Output

All generated SVGs are saved to `./diagrams/`:
- Individual SVG files with timestamps
- `metadata.json` tracking all generations with prompts and specs

## Architecture

### Coordinate Mode (Default)
- **schema.ts** - TypeScript types for coordinate-based shapes
- **llm.ts** - LLM API client with two-step generation (research + generate)
- **generator.ts** - Coordinate JSON-to-SVG conversion

### Semantic Mode
- **schema-semantic.ts** - TypeScript types for semantic shapes
- **llm-semantic.ts** - LLM API client for semantic generation
- **generator-semantic.ts** - Semantic-to-SVG with coordinate calculation

### Shared
- **storage.ts** - File saving with mode tracking
- **cli.ts** - Interactive CLI with mode switching

## Supported Shapes

### Coordinate Mode
- `rect` - Rectangles (with optional rounded corners)
- `circle` - Circles
- `ellipse` - Ellipses
- `line` - Straight lines
- `polyline` - Connected line segments
- `polygon` - Closed polygons
- `path` - Complex curves (bezier, arcs, etc.) using SVG path commands
- `text` - Labels and annotations with font controls

### Semantic Mode
- `triangle` - Equilateral, isosceles, right triangles with orientation
- `rectangle` - Rectangles with semantic sizing
- `circle` - Circles with semantic positioning
- `ellipse` - Ellipses
- `line` - Lines with angle/length
- `diamond` - Rotated squares

All shapes support standard SVG attributes: fill, stroke, opacity, transform, etc.
