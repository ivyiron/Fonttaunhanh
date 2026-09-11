import * as opentype from 'opentype.js';
export function getCoverageGlyphs(coverage: any): number[] {
  if (!coverage) return [];
  if (coverage.format === 1 && Array.isArray(coverage.glyphs)) {
    return coverage.glyphs;
  }
  if (coverage.format === 2 && Array.isArray(coverage.ranges)) {
    const glyphs: number[] = [];
    for (const r of coverage.ranges) {
      const start = r.start !== undefined ? r.start : r.startGlyphID;
      const end = r.end !== undefined ? r.end : r.endGlyphID;
      if (typeof start === 'number' && typeof end === 'number') {
        for (let g = start; g <= end; g++) {
          glyphs.push(g);
        }
      }
    }
    return glyphs;
  }
  if (Array.isArray(coverage.glyphs)) {
    return coverage.glyphs;
  }
  return [];
}

/**
 * Extracts and converts GPOS kerning tables (Format 1 and Format 2 Class-based positioning)
 * into standard font.kerningPairs so they can be written as standard 'kern' table pairs when saved,
 * and utilized for smart Vietnamese character kerning cloning.
 */
export function ensureKerningPairsPopulated(font: any): void {
  if (!font) return;
  if (!font.kerningPairs) {
    font.kerningPairs = {};
  }

  const gpos = font.tables?.gpos;
  if (gpos && gpos.lookups) {
    const lookups = gpos.lookups || [];
    for (const lookup of lookups) {
      if (lookup.lookupType === 2) { // Pair Positioning
        const subtables = lookup.subtables || [];
        for (const subtable of subtables) {
          const posFormat = subtable.posFormat !== undefined ? subtable.posFormat : subtable.format;
          // Format 1: Pair Adjustment (Specific glyph pairs)
          if (posFormat === 1) {
            const coverage = subtable.coverage;
            if (!coverage) continue;
            const leftGlyphs = getCoverageGlyphs(coverage);
            if (leftGlyphs.length === 0) continue;
            const pairSets = subtable.pairSets || [];
            
            for (let i = 0; i < leftGlyphs.length; i++) {
              const leftGlyphIndex = leftGlyphs[i];
              const pairSet = pairSets[i];
              if (!pairSet) continue;
              
              for (const pairValueRecord of pairSet) {
                const rightGlyphIndex = pairValueRecord.secondGlyph;
                const value1 = pairValueRecord.value1;
                if (value1 && typeof value1.xAdvance === 'number' && value1.xAdvance !== 0) {
                  const kernValue = value1.xAdvance;
                  const pairKey = `${leftGlyphIndex},${rightGlyphIndex}`;
                  if (font.kerningPairs[pairKey] === undefined) {
                    font.kerningPairs[pairKey] = kernValue;
                  }
                }
              }
            }
          }
          // Format 2: Class-based Pair Adjustment
          else if (posFormat === 2) {
            const classDef1 = subtable.classDef1;
            const classDef2 = subtable.classDef2;
            const classRecords = subtable.classRecords || [];
            const class1Count = subtable.class1Count || 0;
            const class2Count = subtable.class2Count || 0;
            
            // Helper to fetch glyph class index safely
            const getGlyphClass = (classDef: any, glyphIndex: number): number => {
              if (!classDef) return 0;
              const format = classDef.format !== undefined ? classDef.format : classDef.classFormat;
              if (format === 1) {
                const startGlyph = classDef.startGlyph || 0;
                const classValueArray = classDef.classes || classDef.classValueArray || [];
                const index = glyphIndex - startGlyph;
                if (index >= 0 && index < classValueArray.length) {
                  return classValueArray[index];
                }
                return 0;
              }
              if (format === 2) {
                const ranges = classDef.ranges || classDef.classRangeRecords || [];
                for (const record of ranges) {
                  const start = record.start !== undefined ? record.start : record.startGlyphID;
                  const end = record.end !== undefined ? record.end : record.endGlyphID;
                  const classId = record.classId !== undefined ? record.classId : record.class;
                  if (glyphIndex >= start && glyphIndex <= end) {
                    return classId || 0;
                  }
                }
                return 0;
              }
              if (classDef.classDefs && typeof classDef.classDefs === 'object') {
                return classDef.classDefs[glyphIndex] || 0;
              }
              return 0;
            };

            const numGlyphs = font.glyphs.length;
            const class1ToGlyphs: Record<number, number[]> = {};
            const class2ToGlyphs: Record<number, number[]> = {};

            // Class 1 (left glyphs) MUST be in the coverage table to be valid
            const coverageGlyphs = getCoverageGlyphs(subtable.coverage);
            for (const g of coverageGlyphs) {
              const c1 = getGlyphClass(classDef1, g);
              if (c1 < class1Count) {
                if (!class1ToGlyphs[c1]) class1ToGlyphs[c1] = [];
                class1ToGlyphs[c1].push(g);
              }
            }

            // Class 2 (right glyphs) can be any glyph in the font
            for (let g = 0; g < numGlyphs; g++) {
              const c2 = getGlyphClass(classDef2, g);
              if (c2 < class2Count) {
                if (!class2ToGlyphs[c2]) class2ToGlyphs[c2] = [];
                class2ToGlyphs[c2].push(g);
              }
            }

            // Iterate over Class 1 -> Class 2 records to expand kerning pairs
            for (let c1 = 0; c1 < classRecords.length; c1++) {
              if (c1 >= class1Count) continue;
              const classRecordRow = classRecords[c1];
              if (!classRecordRow) continue;
              
              const firstGlyphsInClass = class1ToGlyphs[c1] || [];
              if (firstGlyphsInClass.length === 0) continue;
              
              for (let c2 = 0; c2 < classRecordRow.length; c2++) {
                if (c2 >= class2Count) continue;
                const classRecord = classRecordRow[c2];
                if (!classRecord) continue;
                
                const value1 = classRecord.value1;
                if (value1 && typeof value1.xAdvance === 'number' && value1.xAdvance !== 0) {
                  const kernValue = value1.xAdvance;
                  const secondGlyphsInClass = class2ToGlyphs[c2] || [];
                  if (secondGlyphsInClass.length === 0) continue;
                  
                  for (const g1 of firstGlyphsInClass) {
                    for (const g2 of secondGlyphsInClass) {
                      const pairKey = `${g1},${g2}`;
                      if (font.kerningPairs[pairKey] === undefined) {
                        font.kerningPairs[pairKey] = kernValue;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Calculates the checksum of a font table according to the OpenType specification
 */
