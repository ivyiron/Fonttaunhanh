import fs from 'fs';
import * as C from './core.mjs';
const mkT = () => { const t = {}; C.DEFAULT_DIACRITICS.forEach(x => t[x.id] = { ...x }); return t; };
const spacingRules = { spacingPreset:'normal', globalTrackingOffset:0, curveTighteningPercent:15,
  applyToLatin:true, applyToVietnamese:true, applyToNumbers:true, applyToPunctuation:true };
const GRID = C.STEP2_RECIPES.filter(r => r.components.length > 0).slice(0, 24).map(r => r.char);

for (const f of ['AbrilFatface-Regular.otf','Vibur.woff','SourceSansPro-Regular.otf','FiraSansOT-Medium.otf']) {
  const raw0 = fs.readFileSync('/home/claude/otjs/test/fonts/' + f);
  const raw = raw0.buffer.slice(raw0.byteOffset, raw0.byteOffset + raw0.byteLength);
  let input = { rawFontBuffer: raw, templates: mkT(), rules: { ...C.DEFAULT_AUTO_RULES },
                overrides: {}, preserveExistingGlyphs: true, spacingRules };
  const t0 = Date.now();
  let s = C.createPreviewSession(input);
  const initial = Date.now() - t0;

  // simulate dragging the lowercase accent gap slider 30 steps, canvas showing ế
  const frames1 = [];
  for (let i = 0; i < 30; i++) {
    input = { ...input, rules: { ...input.rules, lowercaseAccentGap: 45 + i } };
    const a = Date.now();
    s = C.updatePreviewSession(s, input);
    C.previewGlyph(s, 'ế');
    frames1.push(Date.now() - a);
  }

  // same drag but the 24-cell grid is on screen
  const frames2 = [];
  for (let i = 0; i < 30; i++) {
    input = { ...input, rules: { ...input.rules, lowercaseAccentGap: 75 + i } };
    const a = Date.now();
    s = C.updatePreviewSession(s, input);
    C.previewGlyphs(s, GRID);
    frames2.push(Date.now() - a);
  }
  const stat = (a) => `median ${a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)]}ms, worst ${Math.max(...a)}ms`;
  console.log(`${f.padEnd(27)} session ${String(initial).padStart(3)}ms | 1 glyph on canvas: ${stat(frames1).padEnd(26)} | 24-cell grid: ${stat(frames2)}`);
}
