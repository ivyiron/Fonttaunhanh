import fs from 'fs';
import * as C from './core.mjs';
const templates = {}; C.DEFAULT_DIACRITICS.forEach(t => templates[t.id] = { ...t });
const SETTINGS = { intensityMultiplier: 1.0, minThreshold: 10, applyClassics: true,
  applyUpperLower: true, applyPunctuation: true, applyNumbers: true,
  applyVietnameseVariants: true, customPairs: {} };

let fails = 0;
const check = (cond, msg) => { if (!cond) { fails++; console.log('   ✗ ' + msg); } };

for (const f of ['SourceSansPro-Regular.otf','Roboto-Black.ttf','AbrilFatface-Regular.otf',
                 'Vibur.woff','FiraSansOT-Medium.otf','Changa-Regular.ttf','Jomhuria-Regular.ttf']) {
  const raw0 = fs.readFileSync('/home/claude/otjs/test/fonts/' + f);
  const raw = raw0.buffer.slice(raw0.byteOffset, raw0.byteOffset + raw0.byteLength);
  const s = C.createPreviewSession({ rawFontBuffer: raw, templates,
    rules: { ...C.DEFAULT_AUTO_RULES }, overrides: {}, preserveExistingGlyphs: true });
  C.flushPreviewSession(s);
  const font = s.font;
  C.ensureKerningPairsPopulated(font);
  const original = { ...font.kerningPairs };
  const origKeys = Object.keys(original);

  const plans = {};
  for (const level of [0,1,2,3]) {
    plans[level] = C.buildKerningPlan({ font, level, settings: SETTINGS,
      approvedRepairs: level >= 2 ? new Set() : undefined });
  }

  // Guarantee A: level 0 reproduces the original table exactly
  const p0 = plans[0].pairs;
  check(Object.keys(p0).length === origKeys.length, `${f} mức 0: số cặp lệch`);
  check(origKeys.every(k => p0[k] === original[k]), `${f} mức 0: giá trị bị đổi`);
  check(plans[0].report.originalPairsOverwritten === 0, `${f} mức 0: báo ghi đè ≠ 0`);

  // Guarantee B: level 1 never changes a pair the designer wrote
  const p1 = plans[1].pairs;
  check(origKeys.every(k => p1[k] === original[k]), `${f} mức 1: sửa cặp gốc`);
  check(plans[1].report.originalPairsOverwritten === 0, `${f} mức 1: báo ghi đè ≠ 0`);
  check(Object.keys(p1).length >= origKeys.length, `${f} mức 1: mất cặp`);

  // Guarantee C: level 2 with nothing approved equals level 1
  const p2 = plans[2].pairs;
  check(Object.keys(p2).length === Object.keys(p1).length, `${f} mức 2 chưa duyệt: khác mức 1`);
  check(Object.keys(p1).every(k => p2[k] === p1[k]), `${f} mức 2 chưa duyệt: giá trị khác mức 1`);

  // Guarantee D: approving repairs only changes the approved keys
  const collisions = C.findCollisions(font, p1);
  if (collisions.length) {
    const one = collisions[0];
    const p2a = C.buildKerningPlan({ font, level: 2, settings: SETTINGS,
      approvedRepairs: new Set([one.key]) }).pairs;
    const changed = Object.keys({ ...p1, ...p2a }).filter(k => p1[k] !== p2a[k]);
    check(changed.length === 1 && changed[0] === one.key,
      `${f} mức 2: duyệt 1 cặp nhưng đổi ${changed.length} cặp`);
  }

  const r1 = plans[1].report, r3 = plans[3].report;
  console.log(`${f.padEnd(27)} gốc ${String(origKeys.length).padStart(6)} | m1 +${String(r1.pairsAddedForNewGlyphs).padStart(5)} | chạm ${String(collisions.length).padStart(3)} | m3 dựng ${String(r3.pairsRebuilt).padStart(5)}, đè ${r3.originalPairsOverwritten}`);
}
console.log(fails === 0 ? '\nTất cả đảm bảo về mức can thiệp đều đúng.' : `\n${fails} đảm bảo bị vi phạm.`);
