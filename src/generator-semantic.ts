/**
 * Semantic SVG Generator
 *
 * Interprets semantic layer descriptions and calculates exact SVG coordinates
 */

import type { SemanticSvgSpec, SemanticLayer, ShapeDefinition, Position } from './schema-semantic.js';

// Track calculated positions for relative placement
interface CalculatedShape {
  id: string;
  centerX: number;
  centerY: number;
  bounds: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

const calculatedShapes = new Map<string, CalculatedShape>();

/**
 * Calculate triangle points based on semantic description
 */
function calculateTriangle(shape: any, centerX: number, centerY: number): string {
  const { triangleType, orientation, size } = shape;

  if (triangleType === 'equilateral') {
    const height = (size * Math.sqrt(3)) / 2;

    switch (orientation) {
      case 'pointing_right':
        // Tip on right, base on left
        return `${centerX - size/2},${centerY - height/2} ${centerX - size/2},${centerY + height/2} ${centerX + size/2},${centerY}`;

      case 'pointing_left':
        // Tip on left, base on right
        return `${centerX + size/2},${centerY - height/2} ${centerX + size/2},${centerY + height/2} ${centerX - size/2},${centerY}`;

      case 'pointing_up':
        return `${centerX},${centerY - height/2} ${centerX - size/2},${centerY + height/2} ${centerX + size/2},${centerY + height/2}`;

      case 'pointing_down':
        return `${centerX},${centerY + height/2} ${centerX - size/2},${centerY - height/2} ${centerX + size/2},${centerY - height/2}`;
    }
  }

  // Default fallback
  return `${centerX},${centerY - 50} ${centerX - 50},${centerY + 50} ${centerX + 50},${centerY + 50}`;
}

/**
 * Calculate center position for a layer
 */
function calculatePosition(layer: SemanticLayer, canvasWidth: number, canvasHeight: number): { x: number, y: number } {
  const { position } = layer;

  if (position.type === 'absolute') {
    return { x: position.x!, y: position.y! };
  }

  if (position.type === 'centered') {
    return { x: canvasWidth / 2, y: canvasHeight / 2 };
  }

  if (position.type === 'relative' && position.relativeTo) {
    const reference = calculatedShapes.get(position.relativeTo);
    if (!reference) {
      throw new Error(`Reference shape "${position.relativeTo}" not found`);
    }

    const offset = position.offset || 0;

    switch (position.alignment) {
      case 'tip_touches_left':
        return { x: reference.bounds.left + offset, y: reference.centerY };
      case 'tip_touches_right':
        return { x: reference.bounds.right + offset, y: reference.centerY };
      case 'tip_touches_top':
        return { x: reference.centerX, y: reference.bounds.top + offset };
      case 'tip_touches_bottom':
        return { x: reference.centerX, y: reference.bounds.bottom + offset };
      case 'center_aligned':
        return { x: reference.centerX, y: reference.centerY };
      case 'adjacent_left':
        return { x: reference.bounds.left - offset, y: reference.centerY };
      case 'adjacent_right':
        return { x: reference.bounds.right + offset, y: reference.centerY };
      default:
        return { x: reference.centerX, y: reference.centerY };
    }
  }

  // Default to center
  return { x: canvasWidth / 2, y: canvasHeight / 2 };
}

/**
 * Calculate bounds for a shape
 */
function calculateBounds(shape: ShapeDefinition, centerX: number, centerY: number): CalculatedShape['bounds'] {
  switch (shape.shapeType) {
    case 'circle':
      return {
        left: centerX - shape.radius,
        right: centerX + shape.radius,
        top: centerY - shape.radius,
        bottom: centerY + shape.radius,
      };

    case 'rectangle':
      return {
        left: centerX - shape.width / 2,
        right: centerX + shape.width / 2,
        top: centerY - shape.height / 2,
        bottom: centerY + shape.height / 2,
      };

    case 'triangle': {
      const size = shape.size;
      const height = (size * Math.sqrt(3)) / 2;

      if (shape.orientation === 'pointing_right') {
        return {
          left: centerX - size/2,
          right: centerX + size/2,
          top: centerY - height/2,
          bottom: centerY + height/2,
        };
      } else if (shape.orientation === 'pointing_left') {
        return {
          left: centerX - size/2,
          right: centerX + size/2,
          top: centerY - height/2,
          bottom: centerY + height/2,
        };
      }

      // Default bounds
      return {
        left: centerX - size/2,
        right: centerX + size/2,
        top: centerY - size/2,
        bottom: centerY + size/2,
      };
    }

    case 'diamond':
      const halfSize = shape.size / 2;
      return {
        left: centerX - halfSize,
        right: centerX + halfSize,
        top: centerY - halfSize,
        bottom: centerY + halfSize,
      };

    default:
      return {
        left: centerX - 50,
        right: centerX + 50,
        top: centerY - 50,
        bottom: centerY + 50,
      };
  }
}

/**
 * Generate SVG element for a semantic layer
 */
function layerToSvg(layer: SemanticLayer, centerX: number, centerY: number): string {
  const { id, shape, style, description } = layer;

  const styleAttrs: string[] = [`id="${id}"`];
  if (style.fill !== undefined) styleAttrs.push(`fill="${style.fill}"`);
  if (style.stroke !== undefined) styleAttrs.push(`stroke="${style.stroke}"`);
  if (style.strokeWidth !== undefined) styleAttrs.push(`stroke-width="${style.strokeWidth}"`);
  if (style.opacity !== undefined) styleAttrs.push(`opacity="${style.opacity}"`);

  const comment = description ? `  <!-- ${description} -->\n` : '';

  switch (shape.shapeType) {
    case 'triangle': {
      const points = calculateTriangle(shape, centerX, centerY);
      return `${comment}  <polygon ${styleAttrs.join(' ')} points="${points}" />`;
    }

    case 'circle':
      return `${comment}  <circle ${styleAttrs.join(' ')} cx="${centerX}" cy="${centerY}" r="${shape.radius}" />`;

    case 'rectangle': {
      const x = centerX - shape.width / 2;
      const y = centerY - shape.height / 2;
      const attrs = [...styleAttrs, `x="${x}"`, `y="${y}"`, `width="${shape.width}"`, `height="${shape.height}"`];
      if (shape.rounded) attrs.push(`rx="${shape.rounded}"`);
      return `${comment}  <rect ${attrs.join(' ')} />`;
    }

    case 'ellipse':
      return `${comment}  <ellipse ${styleAttrs.join(' ')} cx="${centerX}" cy="${centerY}" rx="${shape.radiusX}" ry="${shape.radiusY}" />`;

    case 'line': {
      const angle = (shape.angle * Math.PI) / 180;
      const halfLength = shape.length / 2;
      const x1 = centerX - Math.cos(angle) * halfLength;
      const y1 = centerY - Math.sin(angle) * halfLength;
      const x2 = centerX + Math.cos(angle) * halfLength;
      const y2 = centerY + Math.sin(angle) * halfLength;
      return `${comment}  <line ${styleAttrs.join(' ')} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    }

    case 'diamond': {
      const halfSize = shape.size / 2;
      const points = `${centerX},${centerY - halfSize} ${centerX + halfSize},${centerY} ${centerX},${centerY + halfSize} ${centerX - halfSize},${centerY}`;
      return `${comment}  <polygon ${styleAttrs.join(' ')} points="${points}" />`;
    }

    default:
      throw new Error(`Unknown shape type: ${(shape as any).shapeType}`);
  }
}

/**
 * Sort layers by dependencies (referenced shapes must come first)
 */
function sortLayersByDependencies(layers: SemanticLayer[]): SemanticLayer[] {
  const sorted: SemanticLayer[] = [];
  const processed = new Set<string>();
  const layerMap = new Map(layers.map(l => [l.id, l]));

  function processLayer(layer: SemanticLayer) {
    if (processed.has(layer.id)) return;

    // If this layer references another, process that one first
    if (layer.position.type === 'relative' && layer.position.relativeTo) {
      const ref = layerMap.get(layer.position.relativeTo);
      if (ref && !processed.has(ref.id)) {
        processLayer(ref);
      }
    }

    sorted.push(layer);
    processed.add(layer.id);
  }

  for (const layer of layers) {
    processLayer(layer);
  }

  return sorted;
}

/**
 * Generate SVG from semantic specification
 */
export function generateSemanticSvg(spec: SemanticSvgSpec): string {
  calculatedShapes.clear();

  const { canvasSize, layers } = spec;

  // Sort layers to handle dependencies
  const sortedLayers = sortLayersByDependencies(layers);

  const svg: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasSize.width} ${canvasSize.height}" width="${canvasSize.width}" height="${canvasSize.height}">`,
    `  <!-- ${spec.description} -->`,
    '',
  ];

  // Process layers in dependency order
  for (const layer of sortedLayers) {
    const center = calculatePosition(layer, canvasSize.width, canvasSize.height);
    const bounds = calculateBounds(layer.shape, center.x, center.y);

    // Store calculated shape for future relative positioning
    calculatedShapes.set(layer.id, {
      id: layer.id,
      centerX: center.x,
      centerY: center.y,
      bounds,
    });

    svg.push(layerToSvg(layer, center.x, center.y));
  }

  svg.push('</svg>');

  return svg.join('\n');
}
