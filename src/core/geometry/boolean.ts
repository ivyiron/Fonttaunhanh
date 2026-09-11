import paper from 'paper';
import { parseSvgPath, commandsToSvgPathD, getExactBoundingBox, orientContours, getSubpaths } from './path';

export function unionSvgPaths(d1: string, d2: string): string {
  if (!d1 || !d1.trim()) return d2 || '';
  if (!d2 || !d2.trim()) return d1 || '';

  try {
    if (!paper.project) {
      paper.setup(new paper.Size(4000, 4000));
    }

    const path1 = new paper.CompoundPath({ pathData: d1, insert: false });
    const path2 = new paper.CompoundPath({ pathData: d2, insert: false });

    const united = path1.unite(path2, { insert: false });
    const resultD = united.pathData;

    path1.remove();
    path2.remove();
    united.remove();

    if (resultD && resultD.trim().length > 0) {
      return resultD;
    }
    return d1 + ' ' + d2;
  } catch (err) {
    console.warn('Paper.js path union fallback:', err);
    return d1 + ' ' + d2;
  }
}

function getSubpathBBox(cmds: any[]) {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  const update = (x: number, y: number) => {
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  };
  cmds.forEach(cmd => {
    if (cmd.x !== undefined && cmd.y !== undefined) update(cmd.x, cmd.y);
    if (cmd.x1 !== undefined && cmd.y1 !== undefined) update(cmd.x1, cmd.y1);
    if (cmd.x2 !== undefined && cmd.y2 !== undefined) update(cmd.x2, cmd.y2);
  });
  return { xMin, xMax, yMin, yMax };
}

export function removeDotFromICommands(commands: any[]): any[] {
  const subpaths = getSubpaths(commands);
  if (subpaths.length <= 1) {
    return commands;
  }

  const bboxes = subpaths.map(cmds => getSubpathBBox(cmds));
  
  let overallYMax = -Infinity;
  let overallYMin = Infinity;
  bboxes.forEach(box => {
    if (box.yMax > overallYMax) overallYMax = box.yMax;
    if (box.yMin < overallYMin) overallYMin = box.yMin;
  });

  const totalHeight = overallYMax - overallYMin;
  if (totalHeight < 100) return commands;

  const thresholdY = overallYMin + 0.45 * totalHeight;

  const filteredSubpaths = subpaths.filter((cmds, idx) => {
    const box = bboxes[idx];
    const isTopmost = box.yMax === overallYMax;
    const isAboveThreshold = box.yMin > thresholdY;
    
    if (isTopmost && box.yMin > overallYMin + 0.25 * totalHeight) {
      return false; // This is the dot, remove it
    }
    if (isAboveThreshold) {
      return false; // This is also a dot, remove it
    }
    return true; // Keep this contour
  });

  if (filteredSubpaths.length === 0) {
    return commands;
  }

  const resultCommands: any[] = [];
  filteredSubpaths.forEach(cmds => {
    resultCommands.push(...cmds);
  });
  return resultCommands;
}

/**
 * Helper to extract glyph indexes from an opentype.js coverage table,
 * correctly supporting both Format 1 (individual glyphs list) and Format 2 (glyph ranges).
 */
