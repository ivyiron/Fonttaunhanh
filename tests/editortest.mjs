import fs from 'fs';
import otd from 'opentype.js';
const ot = otd;
import * as C from './core.mjs';

const SVG = 'M 100 0 L 400 0 L 400 700 L 100 700 Z M 180 80 L 180 620 L 320 620 L 320 80 Z';
let ok = 0, fail = 0;
for (const f of fs.readdirSync('/home/claude/otjs/test/fonts/')) {
  if (!/\.(otf|ttf|woff)$/i.test(f)) continue;
  try {
    const raw = fs.readFileSync('/home/claude/otjs/test/fonts/' + f);
    const ab = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
    const font = ot.parse(ab.slice(0));
    const glyphs = C.getGlyphsFromFont(font).filter(g => g.char && g.unicode).slice(0, 3);
    if (!glyphs.length) { continue; }
    const edited = {};
    glyphs.forEach((g, i) => {
      edited['e' + i] = {
        id: 'e' + i, originalGlyphIndex: g.index, originalName: g.name, originalUnicode: g.unicode,
        originalChar: g.char, originalPath: g.svgPath, originalAdvanceWidth: g.advanceWidth,
        mode: i === 0 ? 'alt' : 'replace', altName: g.name + '.alt',
        altUnicode: C.getNextAvailablePuaCodepoint(font, new Set()),
        svgPath: SVG, scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0, flipY: false,
        advanceWidth: g.advanceWidth, inheritKerning: true, trackingOffset: 0,
        isCompleted: true, isModified: true
      };
    });
    const r = C.compileEditedFont({ rawFontBuffer: ab, editedGlyphs: edited,
      customFamilyName: 'Edited', customSubfamilyName: 'Regular' });
    C.parseFontResilient(r.buffer);
    fs.writeFileSync('/home/claude/t/ed_' + f.replace(/\.\w+$/, '') + '.otf', Buffer.from(r.buffer));
    ok++;
  } catch (e) { fail++; console.log('FAIL', f, e.message.slice(0, 50)); }
}
console.log(`${ok} compiled, ${fail} failed`);
