import fs from 'fs';
import otd from 'opentype.js';
const ot = otd;
import * as C from './core.mjs';

const templates = {}; C.DEFAULT_DIACRITICS.forEach(t => templates[t.id] = { ...t });

// 1. Glyph library extraction: harvest a mark out of a character the font has
const HARVEST = [['á','a','acute'], ['à','a','grave'], ['ã','a','tilde'], ['ả','a','hook'],
                 ['â','a','circumflex'], ['ă','a','breve'], ['ơ','o','horn_o']];

for (const f of ['SourceSansPro-Regular.otf','Roboto-Black.ttf','FiraSansOT-Medium.otf','AbrilFatface-Regular.otf','Changa-Regular.ttf']) {
  const raw0 = fs.readFileSync('/home/claude/otjs/test/fonts/' + f);
  const raw = raw0.buffer.slice(raw0.byteOffset, raw0.byteOffset + raw0.byteLength);
  const font = ot.parse(raw.slice(0));

  const got = [];
  for (const [composed, base, id] of HARVEST) {
    const d = C.getExtractedDiacriticSvgPathFromChar(font, composed, base);
    if (d) {
      const box = C.getExactBoundingBox(C.parseSvgPath(d));
      got.push(`${id}:${Math.round(box.xMax - box.xMin)}×${Math.round(box.yMax - box.yMin)}`);
    }
  }

  // 2. Overlay: composed vs native for a char the font already has
  const s = C.createPreviewSession({ rawFontBuffer: raw, templates, rules: { ...C.DEFAULT_AUTO_RULES },
    overrides: {}, preserveExistingGlyphs: false });
  let overlap = '-';
  const p = C.previewGlyph(s, 'ế');
  const idx = font.charToGlyphIndex('ế');
  if (p && idx > 0) {
    const nb = font.glyphs.get(idx).getBoundingBox();
    const cb = p.path.getBoundingBox();
    overlap = `Δtop ${Math.round(cb.y2 - nb.y2)}u, Δwidth ${Math.round((cb.x2-cb.x1)-(nb.x2-nb.x1))}u`;
  }

  // 3. Native SVG export
  const nativeSvg = C.getNativeCharFullSvg(font, 'ế');
  console.log(`${f.padEnd(27)} trích ${got.length}/${HARVEST.length} dấu | ${got.slice(0,3).join(' ')} | overlay ế: ${overlap} | svg gốc ${nativeSvg ? nativeSvg.length + ' ký tự' : 'không có'}`);
}
