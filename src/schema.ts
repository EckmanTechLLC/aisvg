/**
 * SVG Layer JSON Schema
 *
 * Defines the structure for the LLM's JSON response describing how to build an SVG
 * from layers of primitive shapes.
 */

// Base properties common to all shapes
export interface BaseShapeProps {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  transform?: string;
}

// Rectangle
export interface RectProps extends BaseShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number; // rounded corners
  ry?: number;
}

// Circle
export interface CircleProps extends BaseShapeProps {
  cx: number;
  cy: number;
  r: number;
}

// Ellipse
export interface EllipseProps extends BaseShapeProps {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

// Line
export interface LineProps extends BaseShapeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Polyline (connected lines)
export interface PolylineProps extends BaseShapeProps {
  points: string; // e.g., "0,0 10,10 20,0"
}

// Polygon (closed shape)
export interface PolygonProps extends BaseShapeProps {
  points: string; // e.g., "0,0 10,10 20,0"
}

// Path (complex shapes with curves, arcs, etc.)
export interface PathProps extends BaseShapeProps {
  d: string; // SVG path data (e.g., "M 10,10 L 90,90 Z")
}

// Text (labels and annotations)
export interface TextProps extends BaseShapeProps {
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  textAnchor?: 'start' | 'middle' | 'end';
  dominantBaseline?: 'auto' | 'middle' | 'hanging';
}

// Union of all shape types
export type ShapeProps =
  | RectProps
  | CircleProps
  | EllipseProps
  | LineProps
  | PolylineProps
  | PolygonProps
  | PathProps
  | TextProps;

// Individual layer/shape in the SVG
export interface SvgLayer {
  id: string; // unique identifier for this layer
  type: 'rect' | 'circle' | 'ellipse' | 'line' | 'polyline' | 'polygon' | 'path' | 'text';
  props: ShapeProps;
  description?: string; // optional description of what this layer represents
}

// Complete SVG specification
export interface SvgSpec {
  name: string; // short name/identifier (e.g., "centrifugal_pump")
  description: string; // full description of what this represents
  viewBox: {
    width: number;
    height: number;
    minX?: number; // defaults to 0
    minY?: number; // defaults to 0
  };
  layers: SvgLayer[]; // ordered array - first = bottom, last = top
}

// Response from Claude API
export interface ClaudeResponse {
  svg: SvgSpec;
}
