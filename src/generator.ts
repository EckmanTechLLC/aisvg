/**
 * SVG Generator
 *
 * Converts JSON specification into actual SVG markup
 */

import type {
  SvgSpec,
  SvgLayer,
  ShapeProps,
  RectProps,
  CircleProps,
  EllipseProps,
  LineProps,
  PolylineProps,
  PolygonProps,
  PathProps,
  TextProps,
} from './schema.js';

/**
 * Convert a single layer to SVG element string
 */
function layerToSvg(layer: SvgLayer): string {
  const { id, type, props } = layer;

  // Build common attributes
  const commonAttrs: string[] = [`id="${id}"`];

  const base = props as any;
  if (base.fill !== undefined) commonAttrs.push(`fill="${base.fill}"`);
  if (base.stroke !== undefined) commonAttrs.push(`stroke="${base.stroke}"`);
  if (base.strokeWidth !== undefined) commonAttrs.push(`stroke-width="${base.strokeWidth}"`);
  if (base.opacity !== undefined) commonAttrs.push(`opacity="${base.opacity}"`);
  if (base.transform !== undefined) commonAttrs.push(`transform="${base.transform}"`);

  // Add comment if description exists
  const comment = layer.description ? `  <!-- ${layer.description} -->\n` : '';

  // Generate element based on type
  switch (type) {
    case 'rect': {
      const p = props as RectProps;
      const attrs = [
        ...commonAttrs,
        `x="${p.x}"`,
        `y="${p.y}"`,
        `width="${p.width}"`,
        `height="${p.height}"`,
      ];
      if (p.rx !== undefined) attrs.push(`rx="${p.rx}"`);
      if (p.ry !== undefined) attrs.push(`ry="${p.ry}"`);
      return `${comment}  <rect ${attrs.join(' ')} />`;
    }

    case 'circle': {
      const p = props as CircleProps;
      const attrs = [...commonAttrs, `cx="${p.cx}"`, `cy="${p.cy}"`, `r="${p.r}"`];
      return `${comment}  <circle ${attrs.join(' ')} />`;
    }

    case 'ellipse': {
      const p = props as EllipseProps;
      const attrs = [...commonAttrs, `cx="${p.cx}"`, `cy="${p.cy}"`, `rx="${p.rx}"`, `ry="${p.ry}"`];
      return `${comment}  <ellipse ${attrs.join(' ')} />`;
    }

    case 'line': {
      const p = props as LineProps;
      const attrs = [...commonAttrs, `x1="${p.x1}"`, `y1="${p.y1}"`, `x2="${p.x2}"`, `y2="${p.y2}"`];
      return `${comment}  <line ${attrs.join(' ')} />`;
    }

    case 'polyline': {
      const p = props as PolylineProps;
      const attrs = [...commonAttrs, `points="${p.points}"`];
      return `${comment}  <polyline ${attrs.join(' ')} />`;
    }

    case 'polygon': {
      const p = props as PolygonProps;
      const attrs = [...commonAttrs, `points="${p.points}"`];
      return `${comment}  <polygon ${attrs.join(' ')} />`;
    }

    case 'path': {
      const p = props as PathProps;
      const attrs = [...commonAttrs, `d="${p.d}"`];
      return `${comment}  <path ${attrs.join(' ')} />`;
    }

    case 'text': {
      const p = props as TextProps;
      const attrs = [...commonAttrs, `x="${p.x}"`, `y="${p.y}"`];
      if (p.fontSize !== undefined) attrs.push(`font-size="${p.fontSize}"`);
      if (p.fontFamily !== undefined) attrs.push(`font-family="${p.fontFamily}"`);
      if (p.textAnchor !== undefined) attrs.push(`text-anchor="${p.textAnchor}"`);
      if (p.dominantBaseline !== undefined) attrs.push(`dominant-baseline="${p.dominantBaseline}"`);
      return `${comment}  <text ${attrs.join(' ')}>${p.text}</text>`;
    }

    default:
      throw new Error(`Unknown shape type: ${type}`);
  }
}

/**
 * Generate complete SVG from specification
 */
export function generateSvgMarkup(spec: SvgSpec): string {
  const { viewBox, layers } = spec;

  const minX = viewBox.minX ?? 0;
  const minY = viewBox.minY ?? 0;
  const viewBoxStr = `${minX} ${minY} ${viewBox.width} ${viewBox.height}`;

  // Header
  const svg: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxStr}" width="${viewBox.width}" height="${viewBox.height}">`,
    `  <!-- ${spec.description} -->`,
    '',
  ];

  // Add each layer
  for (const layer of layers) {
    svg.push(layerToSvg(layer));
  }

  // Footer
  svg.push('</svg>');

  return svg.join('\n');
}
