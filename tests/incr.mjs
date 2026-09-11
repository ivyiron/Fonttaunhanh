import fs from 'fs';
import otd from 'opentype.js';
const ot = otd;
import * as C from './core.mjs';

const mkTemplates = () => { const t = {}; C.DEFAULT_DIACRITICS.forEach(x => t[x.id] = { ...x }); return t; };
const spacingRules = { spacingPreset:'normal', globalTrackingOffset:0, curveTighteningPercent:15,
  applyToLatin:true, applyToVietnamese:true, applyToNumbers:true, applyToPunctuation:true };
const ALL = C.STEP2_RECIPES.map(r => r.char);

function base(raw) {
  return { rawFontBuffer: raw, templates: mkTemplates(), rules: { ...C.DEFAULT_AUTO_RULES },
           overrides: {}, preserveExistingGlyphs: true, spacingRules };
}
const sig = (s) => ALL.map(c => { const p = C.previewGlyph(s, c);
  return p ? c + ':' + Math.round(p.advanceWidth) + ':' + p.path.commands.map(k => [k.type, Math.round(k.x*10), Math.round(k.y*10)].join()).join('|') : c + ':none';
}).join('\n');

const scenarios = [
  ['đổi hornOffsetX',   i => ({ ...i, rules: { ...i.rules, hornOffsetX: i.rules.hornOffsetX + 12 } })],
  ['đổi dotBelowScale', i => ({ ...i, rules: { ...i.rules, dotBelowScale: 0.72 } })],
  ['đổi doubleAccentGap', i => ({ ...i, rules: { ...i.rules, doubleAccentGap: 34 } })],
  ['đổi lowercaseAccentGap', i => ({ ...i, rules: { ...i.rules, lowercaseAccentGap: 58 } })],
  ['sửa template acute', i => { const t = { ...i.templates, acute: { ...i.templates.acute, scaleY: 1.18 } }; return { ...i, templates: t }; }],
  ['sửa template circumflex', i => { const t = { ...i.templates, circumflex: { ...i.templates.circumflex, offsetY: 14 } }; return { ...i, templates: t }; }],
  ['override 1 ký tự (ê)', i => ({ ...i, overrides: { ...i.overrides, 'ê': { char:'ê', offsetX:0, offsetY:9, scaleX:1, scaleY:1, advanceWidthTweak:0, isCompleted:false } } })],
  ['đổi spacing preset', i => ({ ...i, spacingRules: { ...i.spacingRules, spacingPreset:'spacious', globalTrackingOffset: 25 } })]
];

for (const f of ['AbrilFatface-Regular.otf','SourceSansPro-Regular.otf','Vibur.woff']) {
  const raw0 = fs.readFileSync('/home/claude/otjs/test/fonts/' + f);
  const raw = raw0.buffer.slice(raw0.byteOffset, raw0.byteOffset + raw0.byteLength);
  console.log('=== ' + f);
  for (const [label, mutate] of scenarios) {
    const start = base(raw);
    let incrSession = C.createPreviewSession(start);
    const nextInput = mutate(start);
    const t0 = Date.now();
    incrSession = C.updatePreviewSession(incrSession, nextInput);
    const tIncr = Date.now() - t0;

    const t1 = Date.now();
    const fullSession = C.createPreviewSession(nextInput);
    const tFull = Date.now() - t1;

    const same = sig(incrSession) === sig(fullSession);
    console.log(`  ${label.padEnd(24)} rebuilt ${String(incrSession.stats.lastInvalidated).padStart(3)}/${ALL.length}  ${String(tIncr).padStart(4)}ms vs full ${String(tFull).padStart(4)}ms  ${same ? 'khớp' : '*** LỆCH ***'}`);
  }
}
