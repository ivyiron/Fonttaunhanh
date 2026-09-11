import fs from 'fs';
import otd from 'opentype.js';
const ot = otd;
import * as C from './core.mjs';

const templates = {};
C.DEFAULT_DIACRITICS.forEach(t => templates[t.id] = t);

const input = (raw) => ({
  rawFontBuffer: raw,
  templates,
  rules: C.DEFAULT_AUTO_RULES,
  overrides: {},
  preserveExistingGlyphs: true,
  spacingRules: { spacingPreset: 'normal', globalTrackingOffset: 0, curveTighteningPercent: 15,
                  applyToLatin: true, applyToVietnamese: true, applyToNumbers: true, applyToPunctuation: true },
  kerningSettings: { enableAutoKerning: true, kerningStrength: 100, inheritFromBase: true,
                     applyOpticalKerning: true, fullFontKerning: false },
  manualKerning: {},
  customFamilyName: 'CoreTest',
  customSubfamilyName: 'Regular'
});

const dir = '/home/claude/otjs/test/fonts/';
let ok = 0, fail = 0;
const results = [];
for (const f of fs.readdirSync(dir)) {
  if (!/\.(otf|ttf|woff)$/i.test(f)) continue;
  try {
    const raw = fs.readFileSync(dir + f);
    const ab = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
    const buffer = C.compileVietnameseFont(input(ab));
    fs.writeFileSync('/home/claude/t/core_' + f.replace(/\.\w+$/, '') + '.otf', Buffer.from(buffer));
    C.parseFontResilient(buffer);
    ok++; results.push([f, buffer.byteLength]);
  } catch (e) {
    fail++; results.push([f, 'FAIL: ' + e.message.slice(0, 55)]);
  }
}
for (const [f, r] of results) console.log(`${typeof r === 'number' ? 'OK  ' : 'FAIL'} ${f.padEnd(34)} ${typeof r === 'number' ? (r/1024|0) + ' KB' : r}`);
console.log(`\n${ok} compiled, ${fail} failed`);
