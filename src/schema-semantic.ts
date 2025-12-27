/**
 * Semantic SVG Layer Schema
 *
 * LLM describes WHAT shapes and their relationships
 * Generator calculates exact coordinates
 */

// Styling properties
export interface ShapeStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

// Position types
export type PositionType = 'absolute' | 'relative' | 'centered';

// Alignment options for relative positioning
export type Alignment =
  | 'tip_touches_left' | 'tip_touches_right'
  | 'tip_touches_top' | 'tip_touches_bottom'
  | 'edge_touches_left' | 'edge_touches_right'
  | 'edge_touches_top' | 'edge_touches_bottom'
  | 'center_aligned' | 'adjacent_left' | 'adjacent_right';

// Position specification
export interface Position {
  type: PositionType;
  // For absolute positioning
  x?: number;
  y?: number;
  // For relative positioning
  relativeTo?: string; // layer ID
  alignment?: Alignment;
  offset?: number; // optional spacing offset
}

// Triangle-specific properties
export interface TriangleShape {
  shapeType: 'triangle';
  triangleType: 'equilateral' | 'isosceles' | 'right';
  orientation: 'pointing_up' | 'pointing_down' | 'pointing_left' | 'pointing_right';
  size: number; // base/side length
}

// Rectangle-specific properties
export interface RectangleShape {
  shapeType: 'rectangle';
  width: number;
  height: number;
  rounded?: number; // corner radius
}

// Circle-specific properties
export interface CircleShape {
  shapeType: 'circle';
  radius: number;
}

// Ellipse-specific properties
export interface EllipseShape {
  shapeType: 'ellipse';
  radiusX: number;
  radiusY: number;
}

// Line-specific properties
export interface LineShape {
  shapeType: 'line';
  length: number;
  angle: number; // degrees, 0 = horizontal right
}

// Diamond (rotated square)
export interface DiamondShape {
  shapeType: 'diamond';
  size: number; // width/height of square before rotation
}

// Union of all shape definitions
export type ShapeDefinition =
  | TriangleShape
  | RectangleShape
  | CircleShape
  | EllipseShape
  | LineShape
  | DiamondShape;

// Semantic layer specification
export interface SemanticLayer {
  id: string;
  shape: ShapeDefinition;
  position: Position;
  style: ShapeStyle;
  description?: string;
}

// Complete semantic SVG specification
export interface SemanticSvgSpec {
  name: string;
  description: string;
  canvasSize: {
    width: number;
    height: number;
  };
  layers: SemanticLayer[];
}
