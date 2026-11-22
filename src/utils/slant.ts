// Slant (italic / backslant) of a font, in degrees. Positive = leans right, negative = leans left.
//
// The font's own post.italicAngle is used when it is set (it is negative for a right lean).
// Many italics and "leaning" display/script fonts leave it at 0, so the angle is also measured on
// the outlines: sample the edges of letters with stems (l I H d n …) in their middle band, shear
// them by candidate angles and keep the angle where the edges stack up into the sharpest vertical
// lines (the classic de-slant score: sum of squared column counts).

type Pt = [number, number];

const SAMPLE_CHARS = 'lIHdhnmiuEbkpqLTF';
const TALL_LOWER = 'ldhbk';

function flatten(commands: any[]): Pt[][] {
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  let last: Pt = [0, 0];
  for (const c of commands) {
    if (c.type === 'M') {
      if (cur.length) out.push(cur);
      cur = [[c.x, c.y]];
      last = [c.x, c.y];
    } else if (c.type === 'L') {
      cur.push([c.x, c.y]);
      last = [c.x, c.y];
    } else if (c.type === 'C') {
      for (let i = 1; i <= 12; i++) {
        const t = i / 12, m = 1 - t;
        cur.push([
          m * m * m * last[0] + 3 * m * m * t * c.x1 + 3 * m * t * t * c.x2 + t * t * t * c.x,
          m * m * m * last[1] + 3 * m * m * t * c.y1 + 3 * m * t * t * c.y2 + t * t * t * c.y
        ]);
      }
      last = [c.x, c.y];
    } else if (c.type === 'Q') {
      for (let i = 1; i <= 8; i++) {
        const t = i / 8, m = 1 - t;
        cur.push([m * m * last[0] + 2 * m * t * c.x1 + t * t * c.x, m * m * last[1] + 2 * m * t * c.y1 + t * t * c.y]);
      }
      last = [c.x, c.y];
    } else if (c.type === 'Z') {
      if (cur.length) out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

/** Angle measured on the outlines (degrees, + = right lean), or 0 when there is nothing to measure. */
export function measureSlant(font: any): number {
  const upm = font.unitsPerEm || 1000;
  const os2 = font.tables?.os2 || {};
  const xh = os2.sxHeight || upm * 0.5;
  const ch = os2.sCapHeight || upm * 0.7;
  const step = Math.max(2, upm / 330);
  const groups: Pt[][] = [];

  for (const c of SAMPLE_CHARS) {
    const g = font.charToGlyph(c);
    if (!g || !g.unicode || !g.path || !g.path.commands.length) continue;
    const top = c === c.toLowerCase() && !TALL_LOWER.includes(c) ? xh : ch;
    const lo = top * 0.2, hi = top * 0.8;
    const pts: Pt[] = [];
    for (const contour of flatten(g.path.commands)) {
      const ring = [...contour, contour[0]];
      for (let i = 0; i + 1 < ring.length; i++) {
        const [x0, y0] = ring[i], [x1, y1] = ring[i + 1];
        const n = Math.max(1, Math.floor(Math.hypot(x1 - x0, y1 - y0) / step));
        for (let k = 0; k < n; k++) {
          const y = y0 + ((y1 - y0) * k) / n;
          if (y >= lo && y <= hi) pts.push([x0 + ((x1 - x0) * k) / n, y]);
        }
      }
    }
    if (pts.length > 20) groups.push(pts);
  }
  if (groups.length < 2) return 0;

  const bin = Math.max(3, upm / 250);
  let best = -1, bestAngle = 0;
  for (let a10 = -350; a10 <= 350; a10 += 5) {
    const tn = Math.tan((a10 / 10) * Math.PI / 180);
    let score = 0;
    for (const pts of groups) {
      const counts = new Map<number, number>();
      for (const [x, y] of pts) {
        const b = Math.floor((x - y * tn) / bin);
        counts.set(b, (counts.get(b) || 0) + 1);
      }
      counts.forEach((v) => (score += v * v));
    }
    if (score > best) {
      best = score;
      bestAngle = a10 / 10;
    }
  }
  return Math.abs(bestAngle) < 1 ? 0 : bestAngle;
}

/** The font's slant: its declared italicAngle when set, otherwise the measured one. */
export function detectSlant(font: any): { angle: number; source: 'declared' | 'measured' | 'none' } {
  const declared = Number(font.tables?.post?.italicAngle) || 0;
  if (Math.abs(declared) >= 0.5) return { angle: Math.round(-declared * 2) / 2, source: 'declared' };
  try {
    const m = measureSlant(font);
    return m ? { angle: m, source: 'measured' } : { angle: 0, source: 'none' };
  } catch {
    return { angle: 0, source: 'none' };
  }
}

/** Lean an SVG-space path (y down) by angle degrees, + = right. Pivot is irrelevant: marks are re-placed by their box. */
export function skewSvgCommands(cmds: any[], angle: number): any[] {
  const tn = Math.tan((angle * Math.PI) / 180);
  if (!tn) return cmds;
  const sx = (x: number, y: number) => x - y * tn;
  return cmds.map((c) => {
    const o: any = { ...c };
    if ('x' in c && 'y' in c) o.x = sx(c.x, c.y);
    if ('x1' in c && 'y1' in c) o.x1 = sx(c.x1, c.y1);
    if ('x2' in c && 'y2' in c) o.x2 = sx(c.x2, c.y2);
    return o;
  });
}
