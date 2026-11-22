// Outline geometry used by the Vietnamese mark composer:
//  - stroke weight of a mark (so a squeezed mark can be given its weight back)
//  - outline offset (thicker / thinner stroke, curves kept)
//  - scale with weight kept
//  - real clearance between two outlines (not bounding boxes)
//
// Commands are opentype.js-style objects: { type: 'M' | 'L' | 'Q' | 'C' | 'Z', x, y, x1, y1, x2, y2 }.
// All functions work in font units and do not care whether y points up or down.

import paper from 'paper';
import { PaperOffset } from 'paperjs-offset';

type Pt = { x: number; y: number };
type Cmd = any;

// ---------------------------------------------------------------- flattening

function splitContours(cmds: Cmd[]): Cmd[][] {
  const out: Cmd[][] = [];
  let cur: Cmd[] | null = null;
  for (const c of cmds) {
    if (c.type === 'M') {
      cur = [];
      out.push(cur);
    }
    if (cur) cur.push(c);
  }
  return out.filter((c) => c.length > 1);
}

function flattenContour(contour: Cmd[], n = 10): Pt[] {
  const pts: Pt[] = [];
  let p: Pt | null = null;
  for (const c of contour) {
    if (c.type === 'M') {
      p = { x: c.x, y: c.y };
      pts.push(p);
    } else if (c.type === 'L') {
      p = { x: c.x, y: c.y };
      pts.push(p);
    } else if (c.type === 'Q' && p) {
      for (let i = 1; i <= n; i++) {
        const t = i / n, u = 1 - t;
        pts.push({ x: u * u * p.x + 2 * u * t * c.x1 + t * t * c.x, y: u * u * p.y + 2 * u * t * c.y1 + t * t * c.y });
      }
      p = { x: c.x, y: c.y };
    } else if (c.type === 'C' && p) {
      for (let i = 1; i <= n; i++) {
        const t = i / n, u = 1 - t;
        pts.push({
          x: u * u * u * p.x + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x,
          y: u * u * u * p.y + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y
        });
      }
      p = { x: c.x, y: c.y };
    }
  }
  return pts;
}

export function flattenOutline(cmds: Cmd[], n = 10): Pt[][] {
  return splitContours(cmds).map((c) => flattenContour(c, n)).filter((p) => p.length > 2);
}

function polyArea(p: Pt[]): number {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length];
    a += p[i].x * q.y - q.x * p[i].y;
  }
  return a / 2;
}

function polyPerimeter(p: Pt[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length];
    s += Math.hypot(q.x - p[i].x, q.y - p[i].y);
  }
  return s;
}

export function outlineBounds(cmds: Cmd[]) {
  let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
  for (const poly of flattenOutline(cmds, 8)) {
    for (const p of poly) {
      if (p.x < xMin) xMin = p.x;
      if (p.x > xMax) xMax = p.x;
      if (p.y < yMin) yMin = p.y;
      if (p.y > yMax) yMax = p.y;
    }
  }
  return { xMin, yMin, xMax, yMax, width: xMax - xMin, height: yMax - yMin, cx: (xMin + xMax) / 2 };
}

export function translateCommands(cmds: Cmd[], dx: number, dy: number): Cmd[] {
  return cmds.map((c) => {
    const o: Cmd = { type: c.type };
    if (c.x !== undefined) { o.x = c.x + dx; o.y = c.y + dy; }
    if (c.x1 !== undefined) { o.x1 = c.x1 + dx; o.y1 = c.y1 + dy; }
    if (c.x2 !== undefined) { o.x2 = c.x2 + dx; o.y2 = c.y2 + dy; }
    return o;
  });
}

function scaleCommands(cmds: Cmd[], sx: number, sy: number): Cmd[] {
  return cmds.map((c) => {
    const o: Cmd = { type: c.type };
    if (c.x !== undefined) { o.x = c.x * sx; o.y = c.y * sy; }
    if (c.x1 !== undefined) { o.x1 = c.x1 * sx; o.y1 = c.y1 * sy; }
    if (c.x2 !== undefined) { o.x2 = c.x2 * sx; o.y2 = c.y2 * sy; }
    return o;
  });
}

// ---------------------------------------------------------------- weight

/** Mean stroke weight: 2 x area / perimeter. Exact for an even stroke; for blobs it is only
 *  good for comparing a mark with itself before and after a transform. */
export function strokeWeight(cmds: Cmd[]): number {
  const polys = flattenOutline(cmds, 12);
  const area = Math.abs(polys.reduce((s, p) => s + polyArea(p), 0));
  const per = polys.reduce((s, p) => s + polyPerimeter(p), 0);
  return per > 0 ? (2 * area) / per : 0;
}

/** x of the lowest point of a mark (the "foot" of an acute or grave). y up is assumed. */
export function lowestPointX(cmds: Cmd[]): number {
  const pts = flattenOutline(cmds, 8).flat();
  if (!pts.length) return 0;
  const minY = Math.min(...pts.map((p) => p.y));
  const tol = Math.max(1, (Math.max(...pts.map((p) => p.y)) - minY) * 0.03);
  const low = pts.filter((p) => p.y <= minY + tol);
  return low.reduce((s, p) => s + p.x, 0) / low.length;
}

// ---------------------------------------------------------------- offset

function toPathData(cmds: Cmd[]): string {
  return cmds
    .map((c) => {
      if (c.type === 'M') return `M${c.x},${c.y}`;
      if (c.type === 'L') return `L${c.x},${c.y}`;
      if (c.type === 'Q') return `Q${c.x1},${c.y1} ${c.x},${c.y}`;
      if (c.type === 'C') return `C${c.x1},${c.y1} ${c.x2},${c.y2} ${c.x},${c.y}`;
      if (c.type === 'Z') return 'Z';
      return '';
    })
    .join(' ');
}

/** paper's own segment reader, so we do not depend on the app's SVG parser here */
function fromPaperItem(item: any): Cmd[] {
  const out: Cmd[] = [];
  const paths: any[] = item.children ? item.children : [item];
  for (const path of paths) {
    const segs = path.segments;
    if (!segs || segs.length < 2) continue;
    const first = segs[0].point;
    out.push({ type: 'M', x: first.x, y: first.y });
    const n = path.closed ? segs.length : segs.length - 1;
    for (let i = 0; i < n; i++) {
      const a = segs[i], b = segs[(i + 1) % segs.length];
      const h1 = a.handleOut, h2 = b.handleIn;
      if (h1.isZero() && h2.isZero()) out.push({ type: 'L', x: b.point.x, y: b.point.y });
      else
        out.push({
          type: 'C',
          x1: a.point.x + h1.x, y1: a.point.y + h1.y,
          x2: b.point.x + h2.x, y2: b.point.y + h2.y,
          x: b.point.x, y: b.point.y
        });
    }
    out.push({ type: 'Z' });
  }
  return out;
}

function signedArea(cmds: Cmd[]): number {
  return flattenOutline(cmds, 6).reduce((s, p) => s + polyArea(p), 0);
}

function reverseOne(contour: Cmd[]): Cmd[] {
  const segs: { k: Cmd; from: Pt }[] = [];
  let p: Pt | null = null;
  for (const k of contour) {
    if (k.type === 'M') p = { x: k.x, y: k.y };
    else if (k.type !== 'Z' && p) {
      segs.push({ k, from: p });
      p = { x: k.x, y: k.y };
    }
  }
  if (!p) return contour;
  const out: Cmd[] = [{ type: 'M', x: p.x, y: p.y }];
  for (let i = segs.length - 1; i >= 0; i--) {
    const { k, from } = segs[i];
    if (k.type === 'L') out.push({ type: 'L', x: from.x, y: from.y });
    else if (k.type === 'Q') out.push({ type: 'Q', x1: k.x1, y1: k.y1, x: from.x, y: from.y });
    else out.push({ type: 'C', x1: k.x2, y1: k.y2, x2: k.x1, y2: k.y1, x: from.x, y: from.y });
  }
  out.push({ type: 'Z' });
  return out;
}

// paperjs-offset works on the default paper scope, the same one utils.ts sets up for unions
function ensurePaper() {
  if (!(paper as any).project) paper.setup(new paper.Size(4000, 4000));
}

/** Push the outline out (d > 0) or in (d < 0) by d font units. Curves stay curves, corners stay
 *  sharp (mitre). Returns the input unchanged if the offset fails. */
export function offsetOutline(cmds: Cmd[], d: number): Cmd[] {
  if (!cmds.length || Math.abs(d) < 0.2) return cmds;
  try {
    ensurePaper();
    const src = new paper.CompoundPath({ pathData: toPathData(cmds), insert: false });
    const res = PaperOffset.offset(src, d, { join: 'miter', limit: 4, insert: false } as any);
    let out = fromPaperItem(res);
    src.remove();
    res.remove();
    if (!out.length) return cmds;
    // keep the direction the font uses for outer contours
    if ((signedArea(cmds) >= 0) !== (signedArea(out) >= 0)) out = splitContours(out).flatMap(reverseOne);
    return out;
  } catch (err) {
    console.warn('offsetOutline failed, outline kept as is:', err);
    return cmds;
  }
}

const keepWeightCache = new Map<string, Cmd[]>();

/**
 * Scale a mark to sx, sy of its size (bottom centre stays where it is) and give it back a stroke
 * weight of `targetWeight` (default: its own weight before scaling). The bounding box of the
 * result is the scaled box. Squeezing deeper than ~75% closes counters (breve cup, circumflex
 * notch) even though the weight number is right: that needs a mark drawn flat by the designer.
 */
export function scaleKeepWeight(cmds: Cmd[], sx: number, sy: number, targetWeight?: number): Cmd[] {
  if (!cmds.length) return cmds;
  const key = toPathData(cmds) + '|' + sx.toFixed(4) + '|' + sy.toFixed(4) + '|' + (targetWeight ?? -1).toFixed(2);
  const hit = keepWeightCache.get(key);
  if (hit) return hit;

  const b = outlineBounds(cmds);
  const w0 = targetWeight ?? strokeWeight(cmds);
  const tw = b.width * sx, th = b.height * sy;
  const place = (c: Cmd[]) => {
    const nb = outlineBounds(c);
    return translateCommands(c, b.cx - nb.cx, b.yMin - nb.yMin);
  };

  let kx = sx, ky = sy, d = 0;
  let out = place(scaleCommands(cmds, kx, ky));
  for (let i = 0; i < 8; i++) {
    const c = offsetOutline(scaleCommands(cmds, kx, ky), d);
    const nb = outlineBounds(c);
    const w = strokeWeight(c);
    out = place(c);
    const ew = tw - nb.width, eh = th - nb.height;
    if (Math.abs(w - w0) < 0.5 && Math.abs(ew) < 1 && Math.abs(eh) < 1) break;
    d += (w0 - w) / 2;
    if (b.width > 0) kx = Math.max(0.05, kx + ew / b.width);
    if (b.height > 0) ky = Math.max(0.05, ky + eh / b.height);
  }

  if (keepWeightCache.size > 600) keepWeightCache.clear();
  keepWeightCache.set(key, out);
  return out;
}

// ---------------------------------------------------------------- clearance

function resample(cmds: Cmd[], step: number): Pt[] {
  const out: Pt[] = [];
  for (const poly of flattenOutline(cmds, 12)) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const k = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
      for (let j = 0; j < k; j++) out.push({ x: a.x + ((b.x - a.x) * j) / k, y: a.y + ((b.y - a.y) * j) / k });
    }
  }
  return out;
}

function winding(pt: Pt, polys: Pt[][]): number {
  let w = 0;
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const cross = (b.x - a.x) * (pt.y - a.y) - (pt.x - a.x) * (b.y - a.y);
      if (a.y <= pt.y) {
        if (b.y > pt.y && cross > 0) w++;
      } else if (b.y <= pt.y && cross < 0) w--;
    }
  }
  return w;
}

/** Smallest distance between two outlines, negative (-1) when they touch or overlap. */
export function outlineClearance(a: Cmd[], b: Cmd[], step = 4): { distance: number; pointA: Pt | null; pointB: Pt | null } {
  const pa = resample(a, step), pb = resample(b, step);
  if (!pa.length || !pb.length) return { distance: Infinity, pointA: null, pointB: null };
  const polysA = flattenOutline(a, 8), polysB = flattenOutline(b, 8);
  for (let i = 0; i < pa.length; i += 3) if (winding(pa[i], polysB) !== 0) return { distance: -1, pointA: pa[i], pointB: pa[i] };
  for (let i = 0; i < pb.length; i += 3) if (winding(pb[i], polysA) !== 0) return { distance: -1, pointA: pb[i], pointB: pb[i] };
  let best = Infinity, ba: Pt | null = null, bb: Pt | null = null;
  for (const p of pa) {
    for (const q of pb) {
      const d = (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y);
      if (d < best) { best = d; ba = p; bb = q; }
    }
  }
  return { distance: Math.sqrt(best), pointA: ba, pointB: bb };
}

// ---------------------------------------------------------------- outline clean-up

/**
 * Snap to the integer grid the font file stores, the way the file will hold it, and drop what
 * snapping makes degenerate: zero-length lines, a closing line back onto the start point, and
 * contours that collapse to nothing. Doing this before checking for crossings matters: two points
 * a fraction of a unit apart can become a tiny bow-tie once rounded.
 */
export function snapOutline(cmds: Cmd[]): Cmd[] {
  const r = (v: number) => Math.round(v);
  const out: Cmd[] = [];
  for (const contour of splitContours(cmds)) {
    const c: Cmd[] = [];
    let start: Pt | null = null, last: Pt | null = null;
    for (const k of contour) {
      if (k.type === 'M') {
        start = last = { x: r(k.x), y: r(k.y) };
        c.push({ type: 'M', x: start.x, y: start.y });
      } else if (k.type === 'L' && last) {
        const p = { x: r(k.x), y: r(k.y) };
        if (p.x === last.x && p.y === last.y) continue;
        c.push({ type: 'L', x: p.x, y: p.y });
        last = p;
      } else if (k.type === 'Q' && last) {
        const p = { x: r(k.x), y: r(k.y) };
        c.push({ type: 'Q', x1: r(k.x1), y1: r(k.y1), x: p.x, y: p.y });
        last = p;
      } else if (k.type === 'C' && last) {
        const p = { x: r(k.x), y: r(k.y) };
        const x1 = r(k.x1), y1 = r(k.y1), x2 = r(k.x2), y2 = r(k.y2);
        // a curve that collapsed onto one point is nothing
        if (p.x === last.x && p.y === last.y && x1 === p.x && y1 === p.y && x2 === p.x && y2 === p.y) continue;
        c.push({ type: 'C', x1, y1, x2, y2, x: p.x, y: p.y });
        last = p;
      }
    }
    // closing line that lands on the start point: Z already closes it
    if (c.length > 2 && start) {
      const end = c[c.length - 1];
      if (end.type === 'L' && end.x === start.x && end.y === start.y) c.pop();
    }
    if (c.length < 3) continue;
    out.push(...c, { type: 'Z' });
  }
  return out;
}

/** Crossings (between contours or a contour with itself), ignoring the shared ends of neighbours. */
function countCrossings(item: any): number {
  return item.getIntersections().filter((loc: any) => {
    const c1 = loc.curve, c2 = loc.intersection?.curve;
    if (!c2 || c1.path !== c2.path) return true;
    const near = (t: number) => t < 1e-6 || t > 1 - 1e-6;
    return !(near(loc.time) && near(loc.intersection.time));
  }).length;
}

function sliverCount(item: any, minArea: number): number {
  const parts: any[] = item.children && item.children.length ? item.children : [item];
  return parts.filter((ch) => Math.abs(ch.area) < minArea || ch.bounds.width < 1 || ch.bounds.height < 1).length;
}

/**
 * Make a composed outline safe for small sizes: snapped to the integer grid, no contour crossing
 * itself or another, no pinched loops, no slivers. Overlaps and self-crossings rasterise as dark
 * spots or light seams at text sizes on some renderers (and with hinting), though they look fine
 * large.
 *
 * The outline is only rebuilt when the snapped one has a problem; a clean letter keeps its points.
 * A rebuilt outline must keep the same box and area (overlaps can only remove area) and must itself
 * be free of crossings after snapping, otherwise the snapped input is kept and `ok` is false.
 */
export function cleanOutline(
  cmds: Cmd[],
  minArea = 4
): { cmds: Cmd[]; changed: boolean; ok: boolean; issues: number } {
  if (!cmds.length) return { cmds, changed: false, ok: true, issues: 0 };
  const snapped = snapOutline(cmds);
  const items: any[] = [];
  const make = (c: Cmd[]) => {
    const it: any = new paper.CompoundPath({ pathData: toPathData(c), insert: false });
    items.push(it);
    return it;
  };
  try {
    ensurePaper();
    const src = make(snapped);
    const issues = countCrossings(src) + sliverCount(src, minArea);
    if (!issues) return { cmds: snapped, changed: false, ok: true, issues: 0 };

    const ref: any = src.clone({ insert: false });
    items.push(ref);
    const refArea = Math.abs(ref.reorient(true, true).area);

    const res: any = (src as any).resolveCrossings().reorient(true, true);
    items.push(res);
    const parts: any[] = res.children && res.children.length ? [...res.children] : [res];
    for (const ch of parts) {
      if (Math.abs(ch.area) < minArea || ch.bounds.width < 1 || ch.bounds.height < 1) ch.remove();
    }
    const fixed = snapOutline(fromPaperItem(res));
    const chk = make(fixed);

    const b0 = src.bounds, b1 = chk.bounds;
    const tol = 1.5;
    const sameBox =
      Math.abs(b0.left - b1.left) <= tol && Math.abs(b0.right - b1.right) <= tol &&
      Math.abs(b0.top - b1.top) <= tol && Math.abs(b0.bottom - b1.bottom) <= tol;
    const chkArea = Math.abs((chk.clone({ insert: false }) as any).reorient(true, true).area);
    const areaOk = chkArea <= refArea + minArea * 4 && chkArea >= refArea * 0.9;
    const clean = countCrossings(chk) === 0 && sliverCount(chk, minArea) === 0;
    const ok = sameBox && areaOk && clean;
    return { cmds: ok ? fixed : snapped, changed: ok, ok, issues };
  } catch (err) {
    console.warn('cleanOutline failed, outline kept as is:', err);
    return { cmds: snapped, changed: false, ok: false, issues: -1 };
  } finally {
    for (const it of items) {
      try { it.remove(); } catch { /* ignore */ }
    }
  }
}
