import { useState, useCallback, useEffect, useRef } from 'react';
import * as opentype from 'opentype.js';
import { FontUploader } from './components/FontUploader';
import { StudioLayout } from './components/layout/StudioLayout';
import { MirroredVideoCanvas } from './components/MirroredVideoCanvas';
import {
  DiacriticTemplate,
  AutoPositionRules,
  GlyphOverrideState,
  FontMetadata,
  VietnameseProjectFile,
  AutoSpacingRules,
  AutoKerningSettings,
  CustomGlyphDesign
} from './types';
import {
  DEFAULT_DIACRITICS,
  DEFAULT_AUTO_RULES,
  VIETNAMESE_RECIPES,
  STEP2_RECIPES,
  getTrackingFamilyMembers,
  isUnaccentedBaseChar,
  composeGlyphPath,
  ensureKerningPairsPopulated,
  injectAdvancedLayoutTables,
  buildKernTable,
  buildGPOSTable,
  findCandidateGlyph,
  extractSvgFromGlyph,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  parseFontResilient,
  parseSvgPath,
  transformCommands
} from './utils';
import {
  generateFullFontKerningPairs,
  calculateAutoSpacingAdjustments,
  findGlyphIndex,
  applySpacingDelta
} from './utils/kerningEngine';
import {
  ensureCombiningMarkGlyphs,
  buildCcmpRules,
  addCcmpFeature,
  updateOS2ForVietnamese,
  prepareGsubForWrite,
  verifyGsubRoundTrip
} from './utils/fontFeatures';
import {
  saveSessionToIndexedDB,
  loadSessionFromIndexedDB,
  clearSessionFromIndexedDB
} from './utils/indexedDB';
import { SessionRestoreModal } from './components/SessionRestoreModal';
import { AlertTriangle, Check, X } from 'lucide-react';

const DEFAULT_SPACING_RULES: AutoSpacingRules = {
  spacingPreset: 'normal',
  globalTrackingOffset: 0,
  curveTighteningPercent: 15,
  applyToLatin: true,
  applyToVietnamese: true,
  applyToNumbers: true,
  applyToPunctuation: true
};

const DEFAULT_KERNING_SETTINGS: AutoKerningSettings = {
  intensityMultiplier: 1.0,
  minThreshold: 10,
  applyClassics: true,
  applyUpperLower: true,
  applyPunctuation: true,
  applyNumbers: true,
  applyVietnameseVariants: true,
  customPairs: {}
};

export default function App() {
  const [originalFont, setOriginalFont] = useState<opentype.Font | null>(null);
  const [rawFontBuffer, setRawFontBuffer] = useState<ArrayBuffer | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<FontMetadata | null>(null);

  // V2 Core States
  const [templates, setTemplates] = useState<Record<string, DiacriticTemplate>>({});
  const [rules, setRules] = useState<AutoPositionRules>(DEFAULT_AUTO_RULES);
  const [overrides, setOverrides] = useState<Record<string, GlyphOverrideState>>({});
  const [spacingRules, setSpacingRules] = useState<AutoSpacingRules>(DEFAULT_SPACING_RULES);
  const [kerningSettings, setKerningSettings] = useState<AutoKerningSettings>(DEFAULT_KERNING_SETTINGS);

  // Existing Vietnamese glyph preservation
  const [preserveExistingGlyphs, setPreserveExistingGlyphs] = useState<boolean>(true);
  const [existingGlyphInfo, setExistingGlyphInfo] = useState<{
    count: number;
    total: number;
    samples: string[];
  }>({ count: 0, total: 134, samples: [] });

  const [compiledBuffer, setCompiledBuffer] = useState<ArrayBuffer | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [appSuccess, setAppSuccess] = useState<string | null>(null);

  const [customFamilyName, setCustomFamilyName] = useState<string>('');
  const [customSubfamilyName, setCustomSubfamilyName] = useState<string>('');

  // Global Settings states
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('app_theme') === 'dark';
    } catch {
      return false;
    }
  });

  const [skipVietnamize, setSkipVietnamize] = useState<boolean>(() => {
    try {
      return localStorage.getItem('skip_vietnamize') === 'true';
    } catch {
      return false;
    }
  });

  const [saveSessionEnabled, setSaveSessionEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('save_session_enabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  // Session Restore state
  const [cachedSession, setCachedSession] = useState<VietnameseProjectFile | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);

  // Sync dark theme class on document element and body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    try {
      localStorage.setItem('app_theme', isDarkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDarkMode]);

  // Sync skipVietnamize setting to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('skip_vietnamize', skipVietnamize ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [skipVietnamize]);

  // Sync saveSessionEnabled setting to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('save_session_enabled', saveSessionEnabled ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [saveSessionEnabled]);

  // On App Mount: Check IndexedDB for existing session
  useEffect(() => {
    let isMounted = true;
    loadSessionFromIndexedDB().then((session) => {
      if (isMounted && session && session.rawFontBufferBase64) {
        setCachedSession(session);
        setShowRestoreModal(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Custom glyph designs from "Edit tàu nhanh"
  const [customGlyphDesigns, setCustomGlyphDesigns] = useState<Record<string, CustomGlyphDesign>>({});
  const customGlyphDesignsRef = useRef<Record<string, CustomGlyphDesign>>({});
  useEffect(() => {
    customGlyphDesignsRef.current = customGlyphDesigns;
  }, [customGlyphDesigns]);

  // Auto-Save session to IndexedDB when working on a font
  useEffect(() => {
    if (!saveSessionEnabled || !rawFontBuffer || !metadata || !filename) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        const base64Buffer = arrayBufferToBase64(rawFontBuffer);
        const sessionPayload: VietnameseProjectFile = {
          ftnVersion: '1.0',
          appName: 'VietHoaTauNhanh',
          savedAt: new Date().toISOString(),
          filename: filename,
          fontMetadata: metadata,
          rawFontBufferBase64: base64Buffer,
          customFamilyName: customFamilyName,
          customSubfamilyName: customSubfamilyName,
          preserveExistingGlyphs: preserveExistingGlyphs,
          templates: { ...templates },
          rules: { ...DEFAULT_AUTO_RULES, ...rules },
          overrides: { ...overrides },
          spacingRules: { ...DEFAULT_SPACING_RULES, ...spacingRules },
          kerningSettings: {
            ...DEFAULT_KERNING_SETTINGS,
            ...kerningSettings,
            customPairs: { ...(kerningSettings?.customPairs || {}) }
          },
          customGlyphDesigns: customGlyphDesignsRef.current || customGlyphDesigns,
          skipVietnamize: skipVietnamize,
          saveSessionEnabled: saveSessionEnabled
        };
        saveSessionToIndexedDB(sessionPayload);
      } catch (err) {
        console.warn('Auto-save session to IndexedDB failed:', err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    saveSessionEnabled,
    rawFontBuffer,
    metadata,
    filename,
    customFamilyName,
    customSubfamilyName,
    preserveExistingGlyphs,
    templates,
    rules,
    overrides,
    spacingRules,
    kerningSettings,
    customGlyphDesigns,
    skipVietnamize
  ]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (appSuccess) {
      const timer = setTimeout(() => {
        setAppSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [appSuccess]);

  // Auto-dismiss error notification
  useEffect(() => {
    if (appError) {
      const timer = setTimeout(() => {
        setAppError(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [appError]);

  // Initialize V2 structure on font load
  const handleFontLoaded = useCallback(
    (loadedFont: opentype.Font, nameOfFile: string, meta: FontMetadata, rawBuffer: ArrayBuffer) => {
      ensureKerningPairsPopulated(loadedFont);
      setOriginalFont(loadedFont);
      setRawFontBuffer(rawBuffer);
      setFilename(nameOfFile);
      setMetadata(meta);
      setCompiledBuffer(rawBuffer);
      setAppError(null);
      setAppSuccess(null);

      setCustomFamilyName(meta.family + ' Viet');
      setCustomSubfamilyName(meta.subfamily || 'Regular');

      // Scan font to detect existing Vietnamese characters
      const existingList: string[] = [];
      VIETNAMESE_RECIPES.forEach((recipe) => {
        const idx = loadedFont.charToGlyphIndex(recipe.char);
        if (idx > 0) {
          const g = loadedFont.glyphs.get(idx);
          if (g && g.path && g.path.commands && g.path.commands.length > 0) {
            existingList.push(recipe.char);
          }
        }
      });

      const existingInfo = {
        count: existingList.length,
        total: VIETNAMESE_RECIPES.length,
        samples: existingList.slice(0, 8)
      };
      setExistingGlyphInfo(existingInfo);

      // Initialize 9 diacritics templates from DEFAULT_DIACRITICS
      const initialTemplates: Record<string, DiacriticTemplate> = {};
      let extractedCount = 0;
      const extractedList: string[] = [];

      DEFAULT_DIACRITICS.forEach((dia) => {
        const candidateGlyph = findCandidateGlyph(loadedFont, dia.id);
        if (candidateGlyph) {
          const fontSvg = extractSvgFromGlyph(candidateGlyph, loadedFont.unitsPerEm);
          if (fontSvg) {
            initialTemplates[dia.id] = {
              ...dia,
              svgPath: fontSvg,
              scaleX: 1.0,
              scaleY: 1.0,
              offsetX: 0,
              offsetY: 0
            };
            extractedCount++;
            extractedList.push(dia.name);
            return;
          }
        }
        // Fallback to default
        initialTemplates[dia.id] = { ...dia };
      });
      setTemplates(initialTemplates);

      if (existingInfo.count === VIETNAMESE_RECIPES.length) {
        setAppSuccess(
          `Font đã có ĐẦY ĐỦ 134/134 ký tự tiếng Việt! Ứng dụng sẽ GIỮ NGUYÊN các ký tự gốc và không ghi đè.`
        );
      } else if (existingInfo.count > 0) {
        setAppSuccess(
          `Phát hiện font đã có sẵn ${existingInfo.count}/${VIETNAMESE_RECIPES.length} ký tự tiếng Việt. App sẽ giữ nguyên và tự động hỗ trợ bổ sung các ký tự còn lại!`
        );
      } else if (extractedCount > 0) {
        setAppSuccess(
          `Đã tự động trích xuất ${extractedCount}/9 dấu mẫu (${extractedList.join(
            ', '
          )}) trực tiếp từ tệp font!`
        );
      } else {
        setAppSuccess('Đã nạp tệp font thành công. Mời bạn bắt đầu tinh chỉnh trong Font Studio.');
      }

      // Initialize individual overrides to empty defaults
      const initialOverrides: Record<string, GlyphOverrideState> = {};
      STEP2_RECIPES.forEach((recipe) => {
        initialOverrides[recipe.char] = {
          char: recipe.char,
          offsetX: 0,
          offsetY: 0,
          scaleX: 1.0,
          scaleY: 1.0,
          advanceWidthTweak: 0,
          isCompleted: false
        };
      });
      setOverrides(initialOverrides);
      setRules(DEFAULT_AUTO_RULES);
    },
    []
  );

  const handleReset = useCallback(() => {
    setOriginalFont(null);
    setRawFontBuffer(null);
    setFilename(null);
    setMetadata(null);
    setTemplates({});
    setOverrides({});
    setCustomGlyphDesigns({});
    setCompiledBuffer(null);
    setAppError(null);
    setAppSuccess(null);
    setCustomFamilyName('');
    setCustomSubfamilyName('');
  }, []);

  const handleUpdateCustomGlyphDesign = useCallback((key: string, updates: Partial<CustomGlyphDesign>) => {
    setCustomGlyphDesigns((prev) => {
      const existing = prev[key] || {
        char: key,
        svgPath: '',
        scaleX: 1.0,
        scaleY: 1.0,
        offsetX: 0,
        offsetY: 0,
        flipY: true,
        mode: 'replace' as const
      };
      const updated = {
        ...prev,
        [key]: {
          ...existing,
          ...updates,
          updatedAt: new Date().toISOString()
        }
      };
      customGlyphDesignsRef.current = updated;
      return updated;
    });
  }, []);

  const handleResetCustomGlyphDesign = useCallback((key: string) => {
    setCustomGlyphDesigns((prev) => {
      const next = { ...prev };
      delete next[key];
      customGlyphDesignsRef.current = next;
      return next;
    });
  }, []);

  const handleUpdateTemplate = useCallback((id: string, updated: Partial<DiacriticTemplate>) => {
    setTemplates((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: { ...current, ...updated }
      };
    });
  }, []);

  const handleBatchUpdateTemplates = useCallback(
    (newTemplates: Record<string, DiacriticTemplate>) => {
      setTemplates(newTemplates);
    },
    []
  );

  const handleUpdateRules = useCallback((updated: Partial<AutoPositionRules>) => {
    setRules((prev) => ({ ...prev, ...updated }));
  }, []);

  const handleUpdateOverride = useCallback((char: string, updated: Partial<GlyphOverrideState>) => {
    setOverrides((prev) => {
      const next = { ...prev };
      const current = next[char] || {
        char,
        offsetX: 0,
        offsetY: 0,
        scaleX: 1.0,
        scaleY: 1.0,
        advanceWidthTweak: 0,
        isCompleted: false
      };

      next[char] = { ...current, ...updated };

      if (updated.advanceWidthTweak !== undefined) {
        const tweakVal = updated.advanceWidthTweak;
        const familyMembers = getTrackingFamilyMembers(char, false);
        familyMembers.forEach((fChar) => {
          if (fChar !== char && !isUnaccentedBaseChar(fChar)) {
            const fCurrent = next[fChar] || {
              char: fChar,
              offsetX: 0,
              offsetY: 0,
              scaleX: 1.0,
              scaleY: 1.0,
              advanceWidthTweak: 0,
              isCompleted: false
            };
            next[fChar] = {
              ...fCurrent,
              advanceWidthTweak: tweakVal
            };
          }
        });
      }

      return next;
    });
  }, []);

  const handleBatchUpdateOverrides = useCallback(
    (newOverrides: Record<string, GlyphOverrideState>) => {
      setOverrides(newOverrides);
    },
    []
  );

  // V2 Compiler Action
  const handleCompileFont = useCallback(
    async (downloadAfterCompile = false) => {
      if (!originalFont || !rawFontBuffer) return;
      setCompiling(true);
      setAppError(null);
      setAppSuccess(null);

      try {
        const { font } = parseFontResilient(rawFontBuffer.slice(0));
        ensureKerningPairsPopulated(font);

        // Rename Font Metadata to avoid collision
        if (font.names && customFamilyName) {
          const subfamily = customSubfamilyName || 'Regular';
          const fullName = `${customFamilyName} ${subfamily}`;
          const postScriptName = `${customFamilyName}-${subfamily}`.replace(/[^a-zA-Z0-9-]/g, '');
          const uniqueID = `${customFamilyName} ${subfamily};Version 2.00`;

          const setAllLangs = (nameObj: any, newVal: string) => {
            if (!nameObj) return { en: newVal };
            Object.keys(nameObj).forEach((lang) => {
              nameObj[lang] = newVal;
            });
            if (!nameObj.en) nameObj.en = newVal;
            return nameObj;
          };

          const names = font.names as any;
          const platforms = ['unicode', 'macintosh', 'windows'];
          platforms.forEach((platform) => {
            if (!names[platform]) names[platform] = {};
            names[platform].fontFamily = setAllLangs(names[platform].fontFamily, customFamilyName);
            names[platform].fontSubfamily = setAllLangs(names[platform].fontSubfamily, subfamily);
            names[platform].fullName = setAllLangs(names[platform].fullName, fullName);
            names[platform].postScriptName = setAllLangs(names[platform].postScriptName, postScriptName);
            names[platform].uniqueID = setAllLangs(names[platform].uniqueID, uniqueID);

            if (names[platform].preferredFamily) {
              names[platform].preferredFamily = setAllLangs(
                names[platform].preferredFamily,
                customFamilyName
              );
            }
            if (names[platform].preferredSubfamily) {
              names[platform].preferredSubfamily = setAllLangs(
                names[platform].preferredSubfamily,
                subfamily
              );
            }
          });
        }

        // Pre-compute character to glyph index map
        const charToGlyphIndexMap: Record<string, number> = {};
        let simulatedGlyphsLength = font.glyphs.length;

        STEP2_RECIPES.forEach((recipe) => {
          const existingIndex = font.charToGlyphIndex(recipe.char);
          if (existingIndex > 0) {
            charToGlyphIndexMap[recipe.char] = existingIndex;
          } else {
            charToGlyphIndexMap[recipe.char] = simulatedGlyphsLength;
            simulatedGlyphsLength++;
          }
        });

        const getGlyphIndexForChar = (c: string): number => {
          if (charToGlyphIndexMap[c] !== undefined) {
            return charToGlyphIndexMap[c];
          }
          return findGlyphIndex(font, c);
        };

        const charHornInfo: Record<string, { yMin: number; yMax: number; excessRight: number }> = {};

        // Compose and inject all Vietnamese composite glyphs (bypassed if skipVietnamize is checked)
        if (!skipVietnamize) {
          STEP2_RECIPES.forEach((recipe) => {
            const unicode = recipe.char.charCodeAt(0);
            const existingIndex = font.charToGlyphIndex(recipe.char);
            const existingGlyph = existingIndex > 0 ? font.glyphs.get(existingIndex) : null;
            const hasOriginalPath =
              existingGlyph &&
              existingGlyph.path &&
              existingGlyph.path.commands &&
              existingGlyph.path.commands.length > 0;

            const isBaseChar = recipe.components.length === 0;

            if (!isBaseChar && preserveExistingGlyphs && hasOriginalPath) {
              return;
            }

            const override = overrides[recipe.char];
            if (isBaseChar && (!override || !override.advanceWidthTweak)) {
              return;
            }

            const { path, advanceWidth, hornInfo } = composeGlyphPath(
              font,
              recipe,
              templates,
              rules,
              override,
              preserveExistingGlyphs
            );
            if (hornInfo) {
              charHornInfo[recipe.char] = hornInfo;
            }

            const glyphOptions = {
              name: recipe.char,
              unicode: unicode,
              unicodes: [unicode],
              advanceWidth: advanceWidth,
              path: path
            };

            if (existingIndex > 0) {
              const newGlyph = new opentype.Glyph({
                ...glyphOptions,
                index: existingIndex
              });
              (font.glyphs as any).glyphs[existingIndex] = newGlyph;
            } else {
              const newIndex = font.glyphs.length;
              const newGlyph = new opentype.Glyph({
                ...glyphOptions,
                index: newIndex
              });
              (font.glyphs as any).glyphs[newIndex] = newGlyph;
              font.glyphs.length++;
            }
          });
        }

        // Inject Custom Glyph Designs from "Edit tàu nhanh"
        const effectiveCustomDesigns = customGlyphDesignsRef.current || customGlyphDesigns || {};
        (Object.values(effectiveCustomDesigns) as CustomGlyphDesign[]).forEach((custom) => {
          if (!custom || !custom.svgPath) return;

          try {
            const rawCmds = parseSvgPath(custom.svgPath);
            if (rawCmds.length === 0) return;

            const flipY = custom.flipY !== false;
            const flipX = custom.flipX === true;
            const transformed = transformCommands(
              rawCmds,
              custom.scaleX,
              custom.scaleY,
              custom.offsetX,
              custom.offsetY,
              flipY,
              flipX
            );

            const newPath = new opentype.Path();
            transformed.forEach((cmd: any) => {
              if (cmd.type === 'M') newPath.moveTo(cmd.x, cmd.y);
              else if (cmd.type === 'L') newPath.lineTo(cmd.x, cmd.y);
              else if (cmd.type === 'Q') newPath.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
              else if (cmd.type === 'C') newPath.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
              else if (cmd.type === 'Z') newPath.close();
            });

            // Find target glyph in font (supports single character, unicode lookup, and glyph name)
            let targetIdx = -1;
            if (custom.char && custom.char.length === 1) {
              targetIdx = font.charToGlyphIndex(custom.char);
            }
            if (targetIdx <= 0) {
              for (let i = 0; i < font.glyphs.length; i++) {
                const g = font.glyphs.get(i);
                if (
                  g &&
                  (g.name === custom.char ||
                    (g.unicode && String.fromCharCode(g.unicode) === custom.char) ||
                    (g.unicodes && g.unicodes.some((u: number) => String.fromCharCode(u) === custom.char)))
                ) {
                  targetIdx = i;
                  break;
                }
              }
            }

            if (targetIdx >= 0) {
              const origGlyph = font.glyphs.get(targetIdx);
              const advWidth = custom.advanceWidth !== undefined ? custom.advanceWidth : (origGlyph?.advanceWidth || 600);

              if (custom.mode === 'replace') {
                origGlyph.path = newPath;
                origGlyph.advanceWidth = advWidth;
              } else if (custom.mode === 'old_is_alt') {
                const altIndex = font.glyphs.length;
                const altGlyph = new opentype.Glyph({
                  name: `${origGlyph.name || 'glyph'}.alt`,
                  advanceWidth: origGlyph.advanceWidth,
                  path: origGlyph.path,
                  index: altIndex
                });
                (font.glyphs as any).glyphs[altIndex] = altGlyph;
                font.glyphs.length++;

                origGlyph.path = newPath;
                origGlyph.advanceWidth = advWidth;
              } else if (custom.mode === 'new_is_alt') {
                const altIndex = font.glyphs.length;
                const altGlyph = new opentype.Glyph({
                  name: `${origGlyph.name || 'glyph'}.alt`,
                  advanceWidth: advWidth,
                  path: newPath,
                  index: altIndex
                });
                (font.glyphs as any).glyphs[altIndex] = altGlyph;
                font.glyphs.length++;
              }
            }
          } catch (err) {
            console.error('Error applying custom glyph design:', custom.char, err);
          }
        });

        // Helper for horn kerning
        const adjustClonedKern = (
          horn: { yMin: number; yMax: number; excessRight: number },
          originalKern: number,
          rightGlyphIndex: number
        ): number => {
          if (horn.excessRight <= 0) return originalKern;

          const rightGlyph = font.glyphs.get(rightGlyphIndex);
          if (
            !rightGlyph ||
            !rightGlyph.path ||
            !rightGlyph.path.commands ||
            rightGlyph.path.commands.length === 0
          ) {
            return originalKern;
          }

          let leftXAtHornHeight = Infinity;
          const yMin = horn.yMin - 35;
          const yMax = horn.yMax + 35;

          rightGlyph.path.commands.forEach((cmd: any) => {
            const checkPoint = (x: number, y: number) => {
              if (y >= yMin && y <= yMax) {
                if (x < leftXAtHornHeight) {
                  leftXAtHornHeight = x;
                }
              }
            };
            if (cmd.x !== undefined && cmd.y !== undefined) checkPoint(cmd.x, cmd.y);
            if (cmd.x1 !== undefined && cmd.y1 !== undefined) checkPoint(cmd.x1, cmd.y1);
            if (cmd.x2 !== undefined && cmd.y2 !== undefined) checkPoint(cmd.x2, cmd.y2);
          });

          if (leftXAtHornHeight !== Infinity) {
            const safetyGap = 60;
            const overlapRisk = horn.excessRight - leftXAtHornHeight;
            if (overlapRisk > -safetyGap) {
              const adjustment = overlapRisk + safetyGap;
              return originalKern + adjustment;
            }
          }
          return originalKern;
        };

        // Kerning Pairs Sync
        if (!font.kerningPairs) {
          font.kerningPairs = {};
        }
        const pairs = font.kerningPairs as Record<string, number>;
        const newPairs: Record<string, number> = {};

        const baseIndexToVariants: Record<number, number[]> = {};
        VIETNAMESE_RECIPES.forEach((recipe) => {
          const baseChar = recipe.baseChar;
          const targetIndex = getGlyphIndexForChar(recipe.char);
          const baseIndex = getGlyphIndexForChar(baseChar);
          if (baseIndex > 0 && targetIndex > 0 && baseIndex !== targetIndex) {
            if (!baseIndexToVariants[baseIndex]) {
              baseIndexToVariants[baseIndex] = [];
            }
            if (!baseIndexToVariants[baseIndex].includes(targetIndex)) {
              baseIndexToVariants[baseIndex].push(targetIndex);
            }
          }
        });

        // Apply Spacing
        const autoSpacingMap = calculateAutoSpacingAdjustments(font, spacingRules);
        for (let i = 0; i < font.glyphs.length; i++) {
          const g = font.glyphs.get(i);
          if (g && g.name) {
            const charStr = g.unicode ? String.fromCharCode(g.unicode) : g.name;
            if (autoSpacingMap[charStr]) {
              applySpacingDelta(g, autoSpacingMap[charStr]);
            }
          }
        }

        // Apply Kerning
        const autoKerningPairs = generateFullFontKerningPairs(font, kerningSettings);
        autoKerningPairs.forEach((pair) => {
          pairs[`${pair.indexLeft},${pair.indexRight}`] = pair.value;
        });

        for (const [key, val] of Object.entries(pairs)) {
          const parts = key.split(',');
          if (parts.length !== 2) continue;
          const g1 = parseInt(parts[0], 10);
          const g2 = parseInt(parts[1], 10);

          const leftCandidates = [g1];
          if (baseIndexToVariants[g1]) {
            leftCandidates.push(...baseIndexToVariants[g1]);
          }

          const rightCandidates = [g2];
          if (baseIndexToVariants[g2]) {
            rightCandidates.push(...baseIndexToVariants[g2]);
          }

          if (leftCandidates.length > 1 || rightCandidates.length > 1) {
            leftCandidates.forEach((g1_cand) => {
              rightCandidates.forEach((g2_cand) => {
                if (g1_cand === g1 && g2_cand === g2) return;

                let adjustedVal = val;
                const recipeForCand = VIETNAMESE_RECIPES.find(
                  (r) => getGlyphIndexForChar(r.char) === g1_cand
                );
                if (recipeForCand) {
                  const horn = charHornInfo[recipeForCand.char];
                  if (horn) {
                    adjustedVal = adjustClonedKern(horn, val, g2_cand);
                  }
                }
                newPairs[`${g1_cand},${g2_cand}`] = adjustedVal;
              });
            });
          }
        }

        Object.assign(pairs, newPairs);

        // Apply custom pairs
        if (kerningSettings.customPairs) {
          Object.entries(kerningSettings.customPairs).forEach(([pairKey, customVal]) => {
            const valNum = Number(customVal) || 0;
            const parts = pairKey.split(',');
            if (parts.length === 2) {
              const idxL = findGlyphIndex(font, parts[0]);
              const idxR = findGlyphIndex(font, parts[1]);
              if (idxL > 0 && idxR > 0) {
                if (valNum === 0) {
                  delete pairs[`${idxL},${idxR}`];
                } else {
                  pairs[`${idxL},${idxR}`] = valNum;
                }
              }
            }
          });
        }

        updateOS2ForVietnamese(font);

        const originalGsubTags = Array.isArray(font.tables?.gsub?.features)
          ? font.tables.gsub.features.map((f: any) => f.tag)
          : [];
        const originalLookupCount = Array.isArray(font.tables?.gsub?.lookups)
          ? font.tables.gsub.lookups.length
          : 0;

        const gsubCheck = prepareGsubForWrite(font);
        let ccmpInstalled = 0;

        if (!skipVietnamize && gsubCheck.ok) {
          ensureCombiningMarkGlyphs(font, templates, rules);
          ccmpInstalled = addCcmpFeature(font, buildCcmpRules(font));
        } else {
          console.info('ccmp skipped, original GSUB copied verbatim instead:', gsubCheck.reason);
        }

        if (font.tables) {
          delete font.tables.gpos;
          delete font.tables.gdef;
          if (ccmpInstalled === 0) {
            delete font.tables.gsub;
          }
        }

        let buffer: ArrayBuffer;
        try {
          buffer = font.toArrayBuffer();

          if (ccmpInstalled > 0) {
            const expected = [...originalGsubTags, 'ccmp'];
            if (!verifyGsubRoundTrip(buffer, expected, originalLookupCount + 1)) {
              throw new Error('GSUB round-trip verification failed');
            }
          }
        } catch (gsubErr: any) {
          if (ccmpInstalled === 0) throw gsubErr;
          console.warn('Falling back to the original GSUB (ccmp disabled):', gsubErr?.message);
          delete font.tables.gsub;
          ccmpInstalled = 0;
          buffer = font.toArrayBuffer();
        }

        const kernTableBytes = buildKernTable(font);
        const gposTableBytes = buildGPOSTable(font);

        buffer = injectAdvancedLayoutTables(buffer, rawFontBuffer, false, kernTableBytes, gposTableBytes);
        setCompiledBuffer(buffer);

        if (downloadAfterCompile) {
          const blob = new Blob([buffer], { type: 'font/opentype' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;

          const cleanFamilyName = (customFamilyName || 'Vietnamese_Font').replace(
            /[^a-zA-Z0-9-]/g,
            '_'
          );
          a.download = `${cleanFamilyName}.otf`;
          a.click();
          URL.revokeObjectURL(url);

          setAppSuccess('Đã xuất bản và tải xuống font thành công!');
        } else {
          setAppSuccess('Đã đồng bộ hóa thành công 134 ký tự tiếng Việt có dấu & Kerning!');
        }
      } catch (err: any) {
        console.error(err);
        setAppError('Biên dịch thất bại: ' + (err.message || 'Kiểm tra lại cấu hình'));
      } finally {
        setCompiling(false);
      }
    },
    [
      originalFont,
      rawFontBuffer,
      templates,
      rules,
      overrides,
      preserveExistingGlyphs,
      customFamilyName,
      customSubfamilyName,
      spacingRules,
      kerningSettings,
      customGlyphDesigns
    ]
  );

  // Auto-sync & recompile font preview when kerning settings or spacing rules change
  useEffect(() => {
    if (!originalFont || !rawFontBuffer) return;
    const timer = setTimeout(() => {
      handleCompileFont(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [spacingRules, kerningSettings, originalFont, rawFontBuffer, handleCompileFont]);

  // Project Save Handler (.ftn)
  const handleSaveProject = useCallback(() => {
    if (!rawFontBuffer || !metadata || !filename) {
      setAppError('Không tìm thấy dữ liệu font để lưu file dự án!');
      return;
    }

    try {
      const base64Buffer = arrayBufferToBase64(rawFontBuffer);
      const effectiveCustomDesigns = customGlyphDesignsRef.current || customGlyphDesigns || {};
      const projectData: VietnameseProjectFile = {
        ftnVersion: '1.0',
        appName: 'VietHoaTauNhanh',
        savedAt: new Date().toISOString(),
        filename: filename,
        fontMetadata: metadata,
        rawFontBufferBase64: base64Buffer,
        customFamilyName: customFamilyName,
        customSubfamilyName: customSubfamilyName,
        preserveExistingGlyphs: preserveExistingGlyphs,
        templates: { ...templates },
        rules: { ...DEFAULT_AUTO_RULES, ...rules },
        overrides: { ...overrides },
        spacingRules: { ...DEFAULT_SPACING_RULES, ...spacingRules },
        kerningSettings: {
          ...DEFAULT_KERNING_SETTINGS,
          ...kerningSettings,
          customPairs: { ...(kerningSettings?.customPairs || {}) }
        },
        customGlyphDesigns: { ...effectiveCustomDesigns },
        skipVietnamize: skipVietnamize,
        saveSessionEnabled: saveSessionEnabled
      };

      const jsonString = JSON.stringify(projectData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const cleanFamily = (customFamilyName || metadata.family || 'du_an').replace(
        /[^a-zA-Z0-9_-]/g,
        '_'
      );
      a.download = `${cleanFamily}_VietHoa.ftn`;
      a.click();
      URL.revokeObjectURL(url);

      setAppSuccess(
        'Đã lưu file dự án (.ftn) thành công! Bạn có thể lưu lại và nạp lại vào lần làm việc sau.'
      );
    } catch (err: any) {
      console.error(err);
      setAppError('Lỗi khi xuất file dự án: ' + (err.message || 'Không thể đóng gói dữ liệu'));
    }
  }, [
    rawFontBuffer,
    metadata,
    filename,
    customFamilyName,
    customSubfamilyName,
    preserveExistingGlyphs,
    templates,
    rules,
    overrides,
    spacingRules,
    kerningSettings,
    customGlyphDesigns,
    skipVietnamize,
    saveSessionEnabled
  ]);

  // Project Load Handler (.ftn)
  const handleLoadProjectData = useCallback((projectData: VietnameseProjectFile) => {
    try {
      if (!projectData.rawFontBufferBase64) {
        throw new Error('Dữ liệu font trong file .ftn bị trống.');
      }

      const buffer = base64ToArrayBuffer(projectData.rawFontBufferBase64);
      const { font } = parseFontResilient(buffer);
      ensureKerningPairsPopulated(font);

      setOriginalFont(font);
      setRawFontBuffer(buffer);
      setFilename(projectData.filename || 'font_project.otf');
      setMetadata(projectData.fontMetadata);

      if (projectData.customFamilyName !== undefined) {
        setCustomFamilyName(projectData.customFamilyName);
      }
      if (projectData.customSubfamilyName !== undefined) {
        setCustomSubfamilyName(projectData.customSubfamilyName);
      }
      if (projectData.preserveExistingGlyphs !== undefined) {
        setPreserveExistingGlyphs(projectData.preserveExistingGlyphs);
      }
      if (projectData.skipVietnamize !== undefined) {
        setSkipVietnamize(projectData.skipVietnamize);
      }
      if (projectData.saveSessionEnabled !== undefined) {
        setSaveSessionEnabled(projectData.saveSessionEnabled);
      }

      if (projectData.templates) {
        const mergedTemplates: Record<string, DiacriticTemplate> = {};
        DEFAULT_DIACRITICS.forEach((dia) => {
          mergedTemplates[dia.id] = { ...dia };
        });
        Object.keys(projectData.templates).forEach((key) => {
          if (isNaN(Number(key)) && projectData.templates[key]) {
            mergedTemplates[key] = {
              ...(mergedTemplates[key] || {}),
              ...projectData.templates[key]
            };
          }
        });
        setTemplates(mergedTemplates);
      }
      if (projectData.rules) {
        setRules({ ...DEFAULT_AUTO_RULES, ...projectData.rules });
      }

      const initialOverrides: Record<string, GlyphOverrideState> = {};
      STEP2_RECIPES.forEach((recipe) => {
        initialOverrides[recipe.char] = {
          char: recipe.char,
          offsetX: 0,
          offsetY: 0,
          scaleX: 1.0,
          scaleY: 1.0,
          advanceWidthTweak: 0,
          isCompleted: false
        };
      });
      if (projectData.overrides) {
        Object.assign(initialOverrides, projectData.overrides);
      }
      setOverrides(initialOverrides);

      if (projectData.spacingRules) {
        setSpacingRules({
          ...DEFAULT_SPACING_RULES,
          ...projectData.spacingRules
        });
      }
      if (projectData.kerningSettings) {
        setKerningSettings({
          ...DEFAULT_KERNING_SETTINGS,
          ...projectData.kerningSettings,
          customPairs: { ...(projectData.kerningSettings.customPairs || {}) }
        });
      }

      const loadedCustomDesigns = projectData.customGlyphDesigns || {};
      setCustomGlyphDesigns(loadedCustomDesigns);
      customGlyphDesignsRef.current = loadedCustomDesigns;

      let count = 0;
      const samples: string[] = [];
      VIETNAMESE_RECIPES.forEach((recipe) => {
        const gIndex = font.charToGlyphIndex(recipe.char);
        if (gIndex > 0) {
          const glyph = font.glyphs.get(gIndex);
          if (
            glyph &&
            ((glyph.path && glyph.path.commands && glyph.path.commands.length > 0) ||
              (glyph.numberOfContours && glyph.numberOfContours > 0))
          ) {
            count++;
            if (samples.length < 10) samples.push(recipe.char);
          }
        }
      });
      setExistingGlyphInfo({ count, total: 134, samples });

      setCompiledBuffer(null);
      setAppSuccess(`Đã nạp thành công file dự án "${projectData.filename}" (.ftn)!`);
    } catch (err: any) {
      console.error(err);
      setAppError(
        'Không thể mở file dự án .ftn: ' + (err.message || 'File hỏng hoặc không đúng định dạng.')
      );
    }
  }, []);

  // Download font handler
  const handleDownloadFont = useCallback(
    (format: 'ttf' | 'woff2' | 'otf' = 'otf') => {
      if (!compiledBuffer) {
        handleCompileFont(true);
        return;
      }
      const mimeType = format === 'woff2' ? 'font/woff2' : 'font/opentype';
      const blob = new Blob([compiledBuffer], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanFamilyName = (customFamilyName || 'Vietnamese_Font').replace(/[^a-zA-Z0-9-]/g, '_');
      a.download = `${cleanFamilyName}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setAppSuccess(`Đã tải xuống tệp font .${format.toUpperCase()} thành công!`);
    },
    [compiledBuffer, customFamilyName, handleCompileFont]
  );

  return (
    <div className={`h-screen w-screen overflow-hidden ${isDarkMode ? 'dark bg-neutral-950 text-neutral-100' : 'bg-neutral-100 text-neutral-900'} flex flex-col font-sans transition-colors duration-150`}>
      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0 pointer-events-none">
        {appError && (
          <div
            id="toast-app-error"
            className="flex items-start gap-3 p-3.5 bg-rose-50/85 dark:bg-rose-950/75 border border-rose-200 dark:border-rose-900/60 shadow-lg backdrop-blur-md text-red-900 dark:text-red-100 text-sm rounded-xl relative pointer-events-auto transition-all"
          >
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="pr-6">
              <p className="font-semibold text-xs text-red-900 dark:text-red-200">Thông báo lỗi</p>
              <p className="text-xs text-red-700/90 dark:text-red-300/90 mt-0.5 leading-relaxed">{appError}</p>
            </div>
            <button
              onClick={() => setAppError(null)}
              className="absolute top-2.5 right-2.5 text-red-400 hover:text-red-700 dark:hover:text-red-200 p-1 rounded-lg transition cursor-pointer"
              title="Đóng"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {appSuccess && (
          <div
            id="toast-app-success"
            className="flex items-start gap-3 p-3.5 bg-emerald-50/85 dark:bg-emerald-950/75 border border-emerald-200 dark:border-emerald-900/60 shadow-lg backdrop-blur-md text-emerald-900 dark:text-emerald-100 text-sm rounded-xl relative pointer-events-auto transition-all"
          >
            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="pr-6">
              <p className="font-semibold text-xs text-emerald-900 dark:text-emerald-200">Thành công</p>
              <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90 mt-0.5 leading-relaxed">{appSuccess}</p>
            </div>
            <button
              onClick={() => setAppSuccess(null)}
              className="absolute top-2.5 right-2.5 text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-200 p-1 rounded-lg transition cursor-pointer"
              title="Đóng"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Studio View or Welcome / Uploader View */}
      {originalFont ? (
        <StudioLayout
          font={originalFont}
          rawFontBuffer={rawFontBuffer}
          compiledBuffer={compiledBuffer}
          fontFileName={filename || 'font.otf'}
          fontMetadata={metadata}
          isDarkMode={isDarkMode}
          onToggleTheme={setIsDarkMode}
          skipVietnamize={skipVietnamize}
          onToggleSkipVietnamize={setSkipVietnamize}
          saveSessionEnabled={saveSessionEnabled}
          onToggleSaveSession={setSaveSessionEnabled}
          templates={templates}
          rules={rules}
          overrides={overrides}
          preserveExistingGlyphs={preserveExistingGlyphs}
          existingGlyphInfo={existingGlyphInfo}
          customGlyphDesigns={customGlyphDesigns}
          spacingRules={spacingRules}
          kerningSettings={kerningSettings}
          customFamilyName={customFamilyName}
          customSubfamilyName={customSubfamilyName}
          compiling={compiling}
          onUpdateTemplate={handleUpdateTemplate}
          onBatchUpdateTemplates={handleBatchUpdateTemplates}
          onUpdateRules={handleUpdateRules}
          onUpdateOverride={handleUpdateOverride}
          onBatchUpdateOverrides={handleBatchUpdateOverrides}
          onTogglePreserveExisting={setPreserveExistingGlyphs}
          onUpdateCustomGlyphDesign={handleUpdateCustomGlyphDesign}
          onResetCustomGlyphDesign={handleResetCustomGlyphDesign}
          onUpdateSpacingRules={(newRules) => setSpacingRules((prev) => ({ ...prev, ...newRules }))}
          onUpdateKerningSettings={(newSettings) =>
            setKerningSettings((prev) => ({ ...prev, ...newSettings }))
          }
          onSetCustomFamilyName={setCustomFamilyName}
          onSetCustomSubfamilyName={setCustomSubfamilyName}
          onCompileFont={() => handleCompileFont(false)}
          onDownloadFont={handleDownloadFont}
          onSaveProject={handleSaveProject}
          onLoadProject={handleLoadProjectData}
          onUploadNewFont={handleReset}
        />
      ) : (
        <div className="relative h-full w-full overflow-hidden select-none">
          {/* Background Video: Decoded ONCE via single video element, rendered to Canvas with 100% frame lock */}
          <MirroredVideoCanvas src="/trainx.webm" />

          {/* Cụm Tải font: luôn cố định bằng khoảng 1/4 h từ trên xuống */}
          <div
            className="absolute left-1/2 -translate-x-1/2 h-full w-full px-4 z-10 pointer-events-auto"
            style={{ top: '2%' }}
          >
            <FontUploader
              onFontLoaded={handleFontLoaded}
              onProjectLoaded={handleLoadProjectData}
              onReset={handleReset}
              metadata={metadata}
              filename={filename}
            />
          </div>

          {/* Cụm logo và tiêu đề: luôn cố định vị trí ở khoảng 1/6 h của video (từ dưới lên) */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-10 pointer-events-auto"
            style={{ bottom: '8%' }}
          >
            <div className="w-full flex items-end justify-between gap-4 sm:gap-5 px-1">
              {/* Logo */}
              <img
                src="/Logo.svg"
                alt="Việt hóa tàu nhanh"
                className="h-16 sm:h-18 w-auto shrink-0 drop-shadow-lg"
              />

              {/* Text */}
              <div className="text-right">
                <p className="text-sm sm:text-base font-semibold text-white drop-shadow-sm leading-snug tracking-tight">
                  Công cụ xào font tiếng Việt
                </p>
                <p className="text-xs sm:text-sm text-neutral-300 mt-0.5 max-w-md drop-shadow-xs leading-relaxed">
                  Việt hóa tàu nhanh - Edit tàu nhanh - Kerning tàu nhanh
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Restore Prompt Modal on App Mount / F5 */}
      {showRestoreModal && cachedSession && (
        <SessionRestoreModal
          isOpen={showRestoreModal}
          savedSession={cachedSession}
          onRestore={() => {
            setShowRestoreModal(false);
            handleLoadProjectData(cachedSession);
            setAppSuccess('Đã khôi phục phiên làm việc trước đó thành công!');
          }}
          onDismiss={() => {
            setShowRestoreModal(false);
            setCachedSession(null);
            clearSessionFromIndexedDB();
          }}
        />
      )}
    </div>
  );
}
