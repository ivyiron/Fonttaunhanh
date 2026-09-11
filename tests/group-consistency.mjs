import fs from 'fs';
import * as C from './core.mjs';
const templates = {}; C.DEFAULT_DIACRITICS.forEach(t => templates[t.id] = { ...t });

// Invariant the engine actually guarantees: the SAME mark, on bases of the same
// case and the same stack depth, lands at the same height. Different marks have
// different shapes, so comparing a grave's top to a tilde's top measures the
// design, not the placement.
const isUpper = c => c === c.toUpperCase() && c !== c.toLowerCase();

for (const f of ['AbrilFatface-Regular.otf','Vibur.woff','SourceSansPro-Regular.otf','Roboto-Black.ttf']) {
  const raw0 = fs.readFileSync('/home/claude/otjs/test/fonts/' + f);
  const raw = raw0.buffer.slice(raw0.byteOffset, raw0.byteOffset + raw0.byteLength);
  const s = C.createPreviewSession({ rawFontBuffer: raw, templates, rules: { ...C.DEFAULT_AUTO_RULES },
    overrides: {}, preserveExistingGlyphs: true });

  const groups = {};
  for (const r of C.STEP2_RECIPES) {
    if (r.components.length === 0) continue;
    const tone = r.components[r.components.length - 1];
    if (tone === 'dot_below') continue;
    const stack = r.components.slice(0, -1).join('+');
    const key = `${tone}/${isUpper(r.baseChar) ? 'U' : 'l'}/${stack}`;
    (groups[key] ||= []).push(r.char);
  }
  let off = 0, total = 0, worst = 0, worstKey = '';
  for (const [key, chars] of Object.entries(groups)) {
    if (chars.length < 2) continue;
    const ps = C.previewGlyphs(s, chars).filter(p => p.source === 'composed');
    if (ps.length < 2) continue;
    const tops = ps.map(p => p.path.getBoundingBox().y2);
    const med = [...tops].sort((a,b)=>a-b)[Math.floor(tops.length/2)];
    for (const t of tops) { total++; const d = Math.abs(t - med); if (d > 1) off++; if (d > worst) { worst = d; worstKey = key; } }
  }
  console.log(`${f.padEnd(27)} ${total} glyph dựng mới | lệch >1u: ${off} | lớn nhất ${Math.round(worst)}u (${worstKey})`);
}
