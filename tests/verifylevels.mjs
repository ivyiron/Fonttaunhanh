import fs from 'fs';
import otd from 'opentype.js';
const ot = otd;
import * as C from './core.mjs';
const templates = {}; C.DEFAULT_DIACRITICS.forEach(t => templates[t.id] = { ...t });
const SPACING = { spacingPreset:'normal', globalTrackingOffset:0, curveTighteningPercent:15,
  applyToLatin:true, applyToVietnamese:true, applyToNumbers:true, applyToPunctuation:true };
const KERNING = { intensityMultiplier:1.0, minThreshold:10, applyClassics:true, applyUpperLower:true,
  applyPunctuation:true, applyNumbers:true, applyVietnameseVariants:true, customPairs:{} };

for (const f of ['SourceSansPro-Regular.otf','AbrilFatface-Regular.otf','Vibur.woff','Scheherazade-Bold.ttf']) {
  const raw0 = fs.readFileSync('/home/claude/otjs/test/fonts/' + f);
  const raw = raw0.buffer.slice(raw0.byteOffset, raw0.byteOffset + raw0.byteLength);
  const cells = [];
  for (const level of [0,1,3]) {
    const buf = C.compileVietnameseFont({ rawFontBuffer: raw, templates, rules: C.DEFAULT_AUTO_RULES,
      overrides: {}, preserveExistingGlyphs: true, spacingRules: SPACING, kerningSettings: KERNING,
      manualKerning: {}, customFamilyName: 'L' + level, customSubfamilyName: 'Regular',
      interventionLevel: level });
    fs.writeFileSync(`/home/claude/t/lv${level}_${f.replace(/\.\w+$/, '')}.otf`, Buffer.from(buf));
    const re = ot.parse(buf.slice(0));
    // does an inherited Vietnamese pair exist?
    const iT = re.charToGlyphIndex('T'), iA = re.charToGlyphIndex('ậ');
    const kp = re.kerningPairs || {};
    cells.push(`m${level}: ${Object.keys(kp).length} cặp, T+ậ=${kp[`${iT},${iA}`] ?? '-'}`);
  }
  console.log(f.padEnd(27), cells.join(' | '));
}
