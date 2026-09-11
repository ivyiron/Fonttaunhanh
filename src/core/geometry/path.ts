import * as opentype from 'opentype.js';
export function extractPathDataFromSvg(svgString: string): string {
  const cleanSvg = svgString.trim();

  // If it's just raw path data (e.g., M10 20 L30 40...)
  if (!cleanSvg.includes('<')) {
    return cleanSvg;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanSvg, 'image/svg+xml');
    
    // Query both paths and basic vector shapes in DOM order
    const elements = doc.querySelectorAll('path, rect, circle, ellipse, line, polygon, polyline');
    
    if (elements.length > 0) {
      const pathDatas: string[] = [];
      elements.forEach(el => {
        const tagName = el.tagName.toLowerCase();
        if (tagName === 'path') {
          const d = el.getAttribute('d');
          if (d) pathDatas.push(d);
        } else if (tagName === 'rect') {
          const x = parseFloat(el.getAttribute('x') || '0');
          const y = parseFloat(el.getAttribute('y') || '0');
          const w = parseFloat(el.getAttribute('width') || '0');
          const h = parseFloat(el.getAttribute('height') || '0');
          let rx = parseFloat(el.getAttribute('rx') || '0');
          let ry = parseFloat(el.getAttribute('ry') || '0');
          
          if (el.hasAttribute('rx') && !el.hasAttribute('ry')) {
            ry = rx;
          } else if (el.hasAttribute('ry') && !el.hasAttribute('rx')) {
            rx = ry;
          }
          
          if (rx > w / 2) rx = w / 2;
          if (ry > h / 2) ry = h / 2;
          
          if (rx > 0 && ry > 0) {
            pathDatas.push(`M ${x + rx} ${y} h ${w - 2 * rx} a ${rx} ${ry} 0 0 1 ${rx} ${ry} v ${h - 2 * ry} a ${rx} ${ry} 0 0 1 ${-rx} ${ry} h ${-w + 2 * rx} a ${rx} ${ry} 0 0 1 ${-rx} ${-ry} v ${-h + 2 * ry} a ${rx} ${ry} 0 0 1 ${rx} ${-ry} Z`);
          } else {
            pathDatas.push(`M ${x} ${y} h ${w} v ${h} h ${-w} Z`);
          }
        } else if (tagName === 'circle') {
          const cx = parseFloat(el.getAttribute('cx') || '0');
          const cy = parseFloat(el.getAttribute('cy') || '0');
          const r = parseFloat(el.getAttribute('r') || '0');
          if (r > 0) {
            pathDatas.push(`M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`);
          }
        } else if (tagName === 'ellipse') {
          const cx = parseFloat(el.getAttribute('cx') || '0');
          const cy = parseFloat(el.getAttribute('cy') || '0');
          const rx = parseFloat(el.getAttribute('rx') || '0');
          const ry = parseFloat(el.getAttribute('ry') || '0');
          if (rx > 0 && ry > 0) {
            pathDatas.push(`M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`);
          }
        } else if (tagName === 'line') {
          const x1 = parseFloat(el.getAttribute('x1') || '0');
          const y1 = parseFloat(el.getAttribute('y1') || '0');
          const x2 = parseFloat(el.getAttribute('x2') || '0');
          const y2 = parseFloat(el.getAttribute('y2') || '0');
          pathDatas.push(`M ${x1} ${y1} L ${x2} ${y2}`);
        } else if (tagName === 'polygon' || tagName === 'polyline') {
          const pointsAttr = el.getAttribute('points') || '';
          const coords = pointsAttr.trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));
          if (coords.length >= 4) {
            let d = `M ${coords[0]} ${coords[1]}`;
            for (let i = 2; i < coords.length; i += 2) {
              if (coords[i+1] !== undefined) {
                d += ` L ${coords[i]} ${coords[i+1]}`;
              }
            }
            if (tagName === 'polygon') {
              d += ' Z';
            }
            pathDatas.push(d);
          }
        }
      });
      
      const mergedPath = pathDatas.join(' ').trim();
      if (mergedPath) {
        return mergedPath;
      }
    }

    // Regex fallback for 'd' attribute
    const regex = /d\s*=\s*["']([^"']+)["']/g;
    let match;
    const pathDatasFallback: string[] = [];
    while ((match = regex.exec(cleanSvg)) !== null) {
      pathDatasFallback.push(match[1]);
    }
    if (pathDatasFallback.length > 0) {
      return pathDatasFallback.join(' ');
    }
  } catch (err) {
    console.error("Lỗi khi trích xuất dữ liệu path từ SVG:", err);
  }

  return '';
}

/**
 * Parses SVG path 'd' strings into opentype.js style commands list
 */
export function parseSvgPath(d: string): any[] {
  const commands: any[] = [];
  
  // Robustly tokenize the SVG path (handling minus signs, exponents, commas, spacing)
  const regex = /([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/g;
  let match;
  const tokens: string[] = [];
  while ((match = regex.exec(d)) !== null) {
    tokens.push(match[0]);
  }

  let i = 0;
  let currentX = 0;
  let currentY = 0;
  let subpathStartX = 0;
  let subpathStartY = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    if (/[MmLlHhVvCcSsQqTtAaZz]/.test(token)) {
      const cmd = token;
      i++;

      if (cmd === 'M' || cmd === 'm') {
        const x = parseFloat(tokens[i++]);
        const y = parseFloat(tokens[i++]);
        if (cmd === 'm') {
          currentX += x;
          currentY += y;
        } else {
          currentX = x;
          currentY = y;
        }
        subpathStartX = currentX;
        subpathStartY = currentY;
        commands.push({ type: 'M', x: currentX, y: currentY });

        // Implicit lineto values
        while (i < tokens.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(tokens[i])) {
          const lx = parseFloat(tokens[i++]);
          const ly = parseFloat(tokens[i++]);
          if (cmd === 'm') {
            currentX += lx;
            currentY += ly;
          } else {
            currentX = lx;
            currentY = ly;
          }
          commands.push({ type: 'L', x: currentX, y: currentY });
        }
      } else if (cmd === 'L' || cmd === 'l') {
        while (i < tokens.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(tokens[i])) {
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);
          if (cmd === 'l') {
            currentX += x;
            currentY += y;
          } else {
            currentX = x;
            currentY = y;
          }
          commands.push({ type: 'L', x: currentX, y: currentY });
        }
      } else if (cmd === 'H' || cmd === 'h') {
        while (i < tokens.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(tokens[i])) {
          const x = parseFloat(tokens[i++]);
          if (cmd === 'h') {
            currentX += x;
          } else {
            currentX = x;
          }
          commands.push({ type: 'L', x: currentX, y: currentY });
        }
      } else if (cmd === 'V' || cmd === 'v') {
        while (i < tokens.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(tokens[i])) {
          const y = parseFloat(tokens[i++]);
          if (cmd === 'v') {
            currentY += y;
          } else {
            currentY = y;
          }
          commands.push({ type: 'L', x: currentX, y: currentY });
        }
      } else if (cmd === 'C' || cmd === 'c') {
        while (i < tokens.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(tokens[i])) {
          const x1 = parseFloat(tokens[i++]);
          const y1 = parseFloat(tokens[i++]);
          const x2 = parseFloat(tokens[i++]);
          const y2 = parseFloat(tokens[i++]);
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);

          let cx1, cy1, cx2, cy2, destX, destY;
          if (cmd === 'c') {
            cx1 = currentX + x1;
            cy1 = currentY + y1;
            cx2 = currentX + x2;
            cy2 = currentY + y2;
            destX = currentX + x;
            destY = currentY + y;
          } else {
            cx1 = x1;
            cy1 = y1;
            cx2 = x2;
            cy2 = y2;
            destX = x;
            destY = y;
          }
          commands.push({ type: 'C', x1: cx1, y1: cy1, x2: cx2, y2: cy2, x: destX, y: destY });
          currentX = destX;
          currentY = destY;
        }
      } else if (cmd === 'Q' || cmd === 'q') {
        while (i < tokens.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(tokens[i])) {
          const x1 = parseFloat(tokens[i++]);
          const y1 = parseFloat(tokens[i++]);
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);

          let cx1, cy1, destX, destY;
          if (cmd === 'q') {
            cx1 = currentX + x1;
            cy1 = currentY + y1;
            destX = currentX + x;
            destY = currentY + y;
          } else {
            cx1 = x1;
            cy1 = y1;
            destX = x;
            destY = y;
          }
          commands.push({ type: 'Q', x1: cx1, y1: cy1, x: destX, y: destY });
          currentX = destX;
          currentY = destY;
        }
      } else if (cmd === 'S' || cmd === 's') {
        while (i < tokens.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(tokens[i])) {
          const x2 = parseFloat(tokens[i++]);
          const y2 = parseFloat(tokens[i++]);
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);

          const prev = commands[commands.length - 1];
          let cx1 = currentX;
          let cy1 = currentY;
          if (prev && prev.type === 'C') {
            cx1 = 2 * currentX - prev.x2;
            cy1 = 2 * currentY - prev.y2;
          }

          const cx2 = cmd === 's' ? currentX + x2 : x2;
          const cy2 = cmd === 's' ? currentY + y2 : y2;
          const destX = cmd === 's' ? currentX + x : x;
          const destY = cmd === 's' ? currentY + y : y;

          commands.push({ type: 'C', x1: cx1, y1: cy1, x2: cx2, y2: cy2, x: destX, y: destY });
          currentX = destX;
          currentY = destY;
        }
      } else if (cmd === 'Z' || cmd === 'z') {
        commands.push({ type: 'Z' });
        currentX = subpathStartX;
        currentY = subpathStartY;
      } else {
        // Skip unknown tokens to avoid loops
        i++;
      }
    } else {
      i++;
    }
  }

  return commands;
}

/**
 * Transforms coordinates of a list of commands using scale, offsets and Y-flipping
 */
export function transformCommands(
  cmds: any[],
  scaleX: number,
  scaleY: number,
  offsetX: number,
  offsetY: number,
  flipY: boolean
): any[] {
  const tY = (val: number) => {
    let y = val;
    if (flipY) y = -y;
    return y * scaleY + offsetY;
  };
  
  const tX = (val: number) => {
    return val * scaleX + offsetX;
  };

  return cmds.map(cmd => {
    if (cmd.type === 'M' || cmd.type === 'L') {
      return { type: cmd.type, x: tX(cmd.x), y: tY(cmd.y) };
    } else if (cmd.type === 'Q') {
      return { 
        type: 'Q', 
        x1: tX(cmd.x1), 
        y1: tY(cmd.y1), 
        x: tX(cmd.x), 
        y: tY(cmd.y) 
      };
    } else if (cmd.type === 'C') {
      return { 
        type: 'C', 
        x1: tX(cmd.x1), 
        y1: tY(cmd.y1), 
        x2: tX(cmd.x2), 
        y2: tY(cmd.y2), 
        x: tX(cmd.x), 
        y: tY(cmd.y) 
      };
    } else if (cmd.type === 'Z') {
      return { type: 'Z' };
    }
    return cmd;
  });
}

/**
 * Calculates bounding box of parsed SVG commands
 */
export function getBoundingBox(cmds: any[]): { xMin: number; xMax: number; yMin: number; yMax: number } {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  
  cmds.forEach(cmd => {
    if (cmd.x !== undefined) {
      if (cmd.x < xMin) xMin = cmd.x;
      if (cmd.x > xMax) xMax = cmd.x;
    }
    if (cmd.y !== undefined) {
      if (cmd.y < yMin) yMin = cmd.y;
      if (cmd.y > yMax) yMax = cmd.y;
    }
    if (cmd.x1 !== undefined) {
      if (cmd.x1 < xMin) xMin = cmd.x1;
      if (cmd.x1 > xMax) xMax = cmd.x1;
    }
    if (cmd.y1 !== undefined) {
      if (cmd.y1 < yMin) yMin = cmd.y1;
      if (cmd.y1 > yMax) yMax = cmd.y1;
    }
    if (cmd.x2 !== undefined) {
      if (cmd.x2 < xMin) xMin = cmd.x2;
      if (cmd.x2 > xMax) xMax = cmd.x2;
    }
    if (cmd.y2 !== undefined) {
      if (cmd.y2 < yMin) yMin = cmd.y2;
      if (cmd.y2 > yMax) yMax = cmd.y2;
    }
  });

  if (xMin === Infinity) {
    return { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };
  }

  return { xMin, xMax, yMin, yMax };
}

/**
 * Calculates a highly accurate tight bounding box of parsed SVG commands by sampling Bezier curve points
 */
export function getExactBoundingBox(cmds: any[]): { xMin: number; xMax: number; yMin: number; yMax: number } {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  
  let currentX = 0;
  let currentY = 0;

  const updateMinMax = (x: number, y: number) => {
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  };

  cmds.forEach(cmd => {
    if (cmd.type === 'M' || cmd.type === 'L') {
      updateMinMax(cmd.x, cmd.y);
      currentX = cmd.x;
      currentY = cmd.y;
    } else if (cmd.type === 'Q') {
      // Sample 20 points along the quadratic curve for extreme precision
      for (let t = 0; t <= 1; t += 0.05) {
        const mt = 1 - t;
        const x = mt * mt * currentX + 2 * mt * t * cmd.x1 + t * t * cmd.x;
        const y = mt * mt * currentY + 2 * mt * t * cmd.y1 + t * t * cmd.y;
        updateMinMax(x, y);
      }
      currentX = cmd.x;
      currentY = cmd.y;
    } else if (cmd.type === 'C') {
      // Sample 20 points along the cubic curve for extreme precision
      for (let t = 0; t <= 1; t += 0.05) {
        const mt = 1 - t;
        const x = mt * mt * mt * currentX + 3 * mt * mt * t * cmd.x1 + 3 * mt * t * t * cmd.x2 + t * t * t * cmd.x;
        const y = mt * mt * mt * currentY + 3 * mt * mt * t * cmd.y1 + 3 * mt * t * t * cmd.y2 + t * t * t * cmd.y;
        updateMinMax(x, y);
      }
      currentX = cmd.x;
      currentY = cmd.y;
    } else if (cmd.type === 'Z') {
      // Z command doesn't move arbitrarily but can close back. Usually M handles start point.
    }
  });

  if (xMin === Infinity) {
    return { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };
  }

  return { xMin, xMax, yMin, yMax };
}

export function getSubpaths(commands: any[]): any[][] {
  const subpaths: any[][] = [];
  let current: any[] = [];
  commands.forEach(cmd => {
    if (cmd.type === 'M') {
      if (current.length > 0) {
        subpaths.push(current);
      }
      current = [cmd];
    } else {
      current.push(cmd);
    }
  });
  if (current.length > 0) {
    subpaths.push(current);
  }
  return subpaths;
}

/**
 * Calculates the signed area of a 2D path contour in font coordinate space (Y-up).
 * Positive area (>0) indicates Clockwise (CW) direction (outer contour in TrueType fonts).
 * Negative area (<0) indicates Counter-Clockwise (CCW) direction (inner hole in TrueType fonts).
 */
export function getContourSignedArea(contour: any[]): number {
  if (!contour || contour.length === 0) return 0;
  
  const points: { x: number; y: number }[] = [];
  let curX = 0;
  let curY = 0;

  contour.forEach(cmd => {
    if (cmd.type === 'M' || cmd.type === 'L') {
      curX = cmd.x;
      curY = cmd.y;
      points.push({ x: curX, y: curY });
    } else if (cmd.type === 'Q') {
      for (let t = 0.1; t <= 1; t += 0.1) {
        const mt = 1 - t;
        const x = mt * mt * curX + 2 * mt * t * cmd.x1 + t * t * cmd.x;
        const y = mt * mt * curY + 2 * mt * t * cmd.y1 + t * t * cmd.y;
        points.push({ x, y });
      }
      curX = cmd.x;
      curY = cmd.y;
    } else if (cmd.type === 'C') {
      for (let t = 0.1; t <= 1; t += 0.1) {
        const mt = 1 - t;
        const x = mt * mt * mt * curX + 3 * mt * mt * t * cmd.x1 + 3 * mt * t * t * cmd.x2 + t * t * t * cmd.x;
        const y = mt * mt * mt * curY + 3 * mt * mt * t * cmd.y1 + 3 * mt * t * t * cmd.y2 + t * t * t * cmd.y;
        points.push({ x, y });
      }
      curX = cmd.x;
      curY = cmd.y;
    }
  });

  if (points.length < 3) return 0;

  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    area += (p1.x * p2.y - p2.x * p1.y);
  }
  return area / 2;
}

/**
 * Reverses the winding direction of a single contour path (M...Z).
 */
export function reverseContour(contour: any[]): any[] {
  if (!contour || contour.length <= 1) return contour;

  const segments: any[] = [];
  let hasZ = false;

  contour.forEach(cmd => {
    if (cmd.type === 'Z') {
      hasZ = true;
    } else {
      segments.push(cmd);
    }
  });

  if (segments.length <= 1) return contour;

  const lastSeg = segments[segments.length - 1];
  const reversed: any[] = [{ type: 'M', x: lastSeg.x, y: lastSeg.y }];

  for (let i = segments.length - 1; i >= 1; i--) {
    const curSeg = segments[i];
    const prevSeg = segments[i - 1];
    const destX = prevSeg.x;
    const destY = prevSeg.y;

    if (curSeg.type === 'L') {
      reversed.push({ type: 'L', x: destX, y: destY });
    } else if (curSeg.type === 'Q') {
      reversed.push({
        type: 'Q',
        x1: curSeg.x1,
        y1: curSeg.y1,
        x: destX,
        y: destY
      });
    } else if (curSeg.type === 'C') {
      reversed.push({
        type: 'C',
        x1: curSeg.x2,
        y1: curSeg.y2,
        x2: curSeg.x1,
        y2: curSeg.y1,
        x: destX,
        y: destY
      });
    }
  }

  if (hasZ) {
    reversed.push({ type: 'Z' });
  }

  return reversed;
}

/**
 * Tests if a point (x, y) is inside a contour using Ray-Casting algorithm.
 */
export function isPointInContour(x: number, y: number, contour: any[]): boolean {
  const points: { x: number; y: number }[] = [];
  contour.forEach(cmd => {
    if (cmd.x !== undefined && cmd.y !== undefined) {
      points.push({ x: cmd.x, y: cmd.y });
    }
  });

  if (points.length < 3) return false;

  let inside = false;
  const n = points.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;

    const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Ensures all outer contours of a glyph match the target orientation (Clockwise for TrueType)
 * and all inner hole contours have the opposite orientation (Counter-Clockwise).
 * This eliminates boolean cutout holes when shapes overlap!
 */
export function getGlyphContours(commands: any[]): any[][] {
  const contours: any[][] = [];
  let currentContour: any[] = [];

  for (const cmd of commands) {
    if (cmd.type === 'M' && currentContour.length > 0) {
      contours.push(currentContour);
      currentContour = [];
    }
    currentContour.push(cmd);
  }
  if (currentContour.length > 0) {
    contours.push(currentContour);
  }
  return contours;
}

export function orientContours(commands: any[], targetOuterClockwise: boolean = true): any[] {
  const contours = getGlyphContours(commands);
  if (contours.length === 0) return commands;

  const resultCommands: any[] = [];

  contours.forEach((contour, i) => {
    const area = getContourSignedArea(contour);
    if (Math.abs(area) < 1e-3) {
      resultCommands.push(...contour);
      return;
    }

    let containmentCount = 0;
    const startCmd = contour[0];
    if (startCmd && startCmd.x !== undefined && startCmd.y !== undefined) {
      contours.forEach((other, j) => {
        if (i !== j) {
          if (isPointInContour(startCmd.x, startCmd.y, other)) {
            containmentCount++;
          }
        }
      });
    }

    const isOuter = (containmentCount % 2 === 0);
    const shouldBeClockwise = isOuter ? targetOuterClockwise : !targetOuterClockwise;
    const isCurrentlyClockwise = area > 0;

    if (shouldBeClockwise !== isCurrentlyClockwise) {
      resultCommands.push(...reverseContour(contour));
    } else {
      resultCommands.push(...contour);
    }
  });

  return resultCommands;
}

/**
 * Converts an array of opentype path commands to an SVG path string d="..."
 */
export function commandsToSvgPathD(cmds: any[]): string {
  if (!cmds || cmds.length === 0) return '';
  return cmds.map(cmd => {
    if (cmd.type === 'M') return `M ${cmd.x} ${cmd.y}`;
    if (cmd.type === 'L') return `L ${cmd.x} ${cmd.y}`;
    if (cmd.type === 'Q') return `Q ${cmd.x1} ${cmd.y1} ${cmd.x} ${cmd.y}`;
    if (cmd.type === 'C') return `C ${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`;
    if (cmd.type === 'Z') return `Z`;
    return '';
  }).join(' ');
}

/**
 * Performs a 2D Boolean Union of two SVG paths using Paper.js.
 * Merges overlapping boundaries into a single continuous outline, removing internal overlapping edges.
 */
