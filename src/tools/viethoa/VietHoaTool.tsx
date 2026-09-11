import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type * as opentype from 'opentype.js';
import type {
  DiacriticTemplate,
  AutoPositionRules,
  GlyphOverrideState,
  AutoSpacingRules,
  FontMetadata
} from '../../core/session';
import {
  createPreviewSession,
  updatePreviewSession,
  previewGlyph,
  getGroupReferenceHeights,
  getNativeCharFullSvg,
  formatSvgPathToFullSvg,
  commandsToSvgPathD,
  DEFAULT_DIACRITICS,
  DEFAULT_AUTO_RULES,
  STEP2_RECIPES,
  type PreviewSession,
  type PreviewInput
} from '../../core/index';

import { StudioShell } from '../../ui/shell/StudioShell';
import { PreviewCanvas, type ViewMode } from '../../ui/glyph/PreviewCanvas';
import { ToneGalleryStrip } from '../../ui/glyph/ToneGalleryStrip';
import { GlyphLibraryModal } from '../../ui/glyph/GlyphLibraryModal';
import { CopySvgButtons } from '../../ui/inspector/CopySvgButtons';
import { MarkLibraryPanel } from './panels/MarkLibraryPanel';
import { MarkInspector } from './panels/MarkInspector';
import { VietGlyphListPanel } from './panels/VietGlyphListPanel';
import { ComposeInspector } from './panels/ComposeInspector';

export interface VietHoaState {
  templates: Record<string, DiacriticTemplate>;
  rules: AutoPositionRules;
  overrides: Record<string, GlyphOverrideState>;
  preserveExistingGlyphs: boolean;
  spacingRules?: AutoSpacingRules;
}

interface VietHoaToolProps {
  font: opentype.Font;
  metadata: FontMetadata;
  rawFontBuffer: ArrayBuffer;
  state: VietHoaState;
  onStateChange: (patch: Partial<VietHoaState>) => void;
  header: React.ReactNode;
  statusBar: React.ReactNode;
  dock: React.ReactNode;
  dockExpanded: boolean;
}

export const defaultVietHoaState = (): VietHoaState => {
  const templates: Record<string, DiacriticTemplate> = {};
  DEFAULT_DIACRITICS.forEach((t: DiacriticTemplate) => { templates[t.id] = { ...t }; });
  return {
    templates,
    rules: { ...DEFAULT_AUTO_RULES },
    overrides: {},
    preserveExistingGlyphs: true
  };
};

const EXAMPLE_FOR_MARK: Record<string, string> = {
  acute: 'á', grave: 'à', hook: 'ả', tilde: 'ã', dot_below: 'ạ',
  circumflex: 'â', breve: 'ă', horn_o: 'ơ', horn_u: 'ư', bar: 'đ'
};

export const VietHoaTool: React.FC<VietHoaToolProps> = ({
  font, metadata, rawFontBuffer, state, onStateChange,
  header, statusBar, dock, dockExpanded
}) => {
  const [tab, setTab] = useState<'marks' | 'characters'>('marks');
  const [activeMarkId, setActiveMarkId] = useState('acute');
  const [activeChar, setActiveChar] = useState<string>('ế');
  const [isUppercase, setIsUppercase] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showGuides, setShowGuides] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('composed');
  const [libraryOpen, setLibraryOpen] = useState(false);

  // ---- preview session -----------------------------------------------------
  // Every settings change goes through updatePreviewSession, which marks the
  // affected characters stale and returns immediately. The actual composition
  // happens when a panel reads a glyph. Nothing here ever calls the compiler.
  const previewInput: PreviewInput = useMemo(() => ({
    rawFontBuffer,
    templates: state.templates,
    rules: state.rules,
    overrides: state.overrides,
    preserveExistingGlyphs: state.preserveExistingGlyphs,
    spacingRules: state.spacingRules
  }), [rawFontBuffer, state]);

  const sessionRef = useRef<PreviewSession | null>(null);
  const [, forceRepaint] = useState(0);

  useEffect(() => {
    sessionRef.current = sessionRef.current
      ? updatePreviewSession(sessionRef.current, previewInput)
      : createPreviewSession(previewInput);
    forceRepaint(n => n + 1);
  }, [previewInput]);

  const session = sessionRef.current;

  // ---- derived -------------------------------------------------------------
  const groupHeights = useMemo(() => getGroupReferenceHeights(font), [font]);

  // Stem width of H at half x-height, so a pasted mark can be reported as a
  // percentage of the font's own weight rather than in bare font units.
  const stemWidth = useMemo(() => {
    try {
      const idx = font.charToGlyphIndex('H');
      if (idx <= 0) return undefined;
      const box = font.glyphs.get(idx)?.getBoundingBox();
      if (!box) return undefined;
      return Math.round((box.x2 - box.x1) * 0.18);
    } catch {
      return undefined;
    }
  }, [font]);

  const markExampleChar = EXAMPLE_FOR_MARK[activeMarkId] ?? 'á';
  const shownChar = tab === 'marks'
    ? (isUppercase ? markExampleChar.toUpperCase() : markExampleChar)
    : activeChar;

  const preview = session ? previewGlyph(session, shownChar) : null;

  // The font's own outline for this character, in font units - the same space the
  // composed preview lives in, so overlay lines them up without any conversion.
  const nativeGlyph = useMemo(() => {
    const idx = font.charToGlyphIndex(shownChar);
    if (idx <= 0) return null;
    const g = font.glyphs.get(idx);
    return g?.path?.commands?.length ? g.path : null;
  }, [font, shownChar]);

  const hasNative = !!nativeGlyph;

  const svgExports = useMemo(() => ({
    composed: preview ? formatSvgPathToFullSvg(commandsToSvgPathD(preview.path.commands as any[])) : undefined,
    native: hasNative ? getNativeCharFullSvg(font, shownChar) : undefined,
    mark: tab === 'marks' && state.templates[activeMarkId]?.svgPath
      ? formatSvgPathToFullSvg(state.templates[activeMarkId].svgPath)
      : undefined
  }), [preview, hasNative, font, shownChar, tab, state.templates, activeMarkId]);

  const componentCount = useMemo(() => {
    const r = (STEP2_RECIPES as any[]).find(x => x.char === activeChar);
    return r ? r.components.length : 0;
  }, [activeChar]);

  const groupTopY = tab === 'characters'
    ? (activeChar === activeChar.toUpperCase() && activeChar !== activeChar.toLowerCase()
        ? groupHeights.capHeightMax
        : groupHeights.xHeightMax)
    : undefined;

  const touchedMarks = useMemo(() => {
    const out = new Set<string>();
    const defaults: Record<string, DiacriticTemplate> = {};
    DEFAULT_DIACRITICS.forEach((t: DiacriticTemplate) => { defaults[t.id] = t; });
    for (const [id, t] of Object.entries(state.templates) as [string, DiacriticTemplate][]) {
      const d = defaults[id];
      if (!d) continue;
      if (t.svgPath !== d.svgPath || t.scaleX !== d.scaleX || t.scaleY !== d.scaleY ||
          t.offsetX !== d.offsetX || t.offsetY !== d.offsetY) out.add(id);
    }
    return out;
  }, [state.templates]);

  const touchedChars = useMemo(
    () => new Set(Object.keys(state.overrides)),
    [state.overrides]
  );

  // ---- handlers ------------------------------------------------------------
  const updateTemplate = useCallback((id: string, patch: Partial<DiacriticTemplate>) => {
    onStateChange({ templates: { ...state.templates, [id]: { ...state.templates[id], ...patch } } });
  }, [state.templates, onStateChange]);

  const updateRules = useCallback((patch: Partial<AutoPositionRules>) => {
    onStateChange({ rules: { ...state.rules, ...patch } });
  }, [state.rules, onStateChange]);

  const updateOverride = useCallback((char: string, patch: Partial<GlyphOverrideState>) => {
    const current = state.overrides[char] ?? {
      char, offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1,
      advanceWidthTweak: 0, isCompleted: false
    };
    onStateChange({ overrides: { ...state.overrides, [char]: { ...current, ...patch } } });
  }, [state.overrides, onStateChange]);

  const resetOverride = useCallback((char: string) => {
    const next = { ...state.overrides };
    delete next[char];
    onStateChange({ overrides: next });
  }, [state.overrides, onStateChange]);

  const markDone = useCallback((char: string) => {
    updateOverride(char, { isCompleted: !(state.overrides[char]?.isCompleted) });
  }, [state.overrides, updateOverride]);

  // ---- render --------------------------------------------------------------
  const tabs = (
    <div className="flex items-center gap-1 px-4 py-1.5 bg-white border-b border-neutral-100">
      {(['marks', 'characters'] as const).map(t => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={[
            'px-3 py-1 text-xs rounded-md transition',
            tab === t ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
          ].join(' ')}
        >
          {t === 'marks' ? 'Dấu' : 'Chi tiết'}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-2 text-[10px] text-neutral-400">
        <div className="flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded-md">
          {(['composed', 'native', 'overlay'] as ViewMode[]).map(m => (
            <button
              key={m}
              disabled={m !== 'composed' && !hasNative}
              onClick={() => setViewMode(m)}
              title={m !== 'composed' && !hasNative ? 'Font gốc không có ký tự này' : undefined}
              className={[
                'px-1.5 py-0.5 rounded transition',
                viewMode === m ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500',
                m !== 'composed' && !hasNative ? 'opacity-40 cursor-not-allowed' : ''
              ].join(' ')}
            >
              {m === 'composed' ? 'Dựng mới' : m === 'native' ? 'Gốc' : 'Chồng'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={showGuides} onChange={e => setShowGuides(e.target.checked)}
                 className="w-3 h-3 accent-neutral-900" />
          Đường dóng
        </label>
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="px-1.5 hover:text-neutral-800">−</button>
        <span className="w-8 text-center font-mono">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="px-1.5 hover:text-neutral-800">+</button>
        {session ? (
          <span className="font-mono" title="Thời gian dựng lại lần cuối">
            {session.stats.lastRebuildMs}ms / {session.stats.lastRebuiltChars} glyph
          </span>
        ) : null}
      </div>
    </div>
  );

  const shell = (
    <StudioShell
      leftWidth={tab === 'marks' ? 'narrow' : 'wide'}
      rightWidth="wide"
      dockExpanded={dockExpanded}
      header={<div className="shrink-0">{header}{tabs}</div>}
      left={
        tab === 'marks' ? (
          <MarkLibraryPanel
            templates={state.templates}
            activeMarkId={activeMarkId}
            onSelectMark={setActiveMarkId}
            rules={state.rules}
            onUpdateRules={updateRules}
            touchedMarks={touchedMarks}
          />
        ) : (
          <VietGlyphListPanel
            session={session}
            activeChar={activeChar}
            onSelectChar={setActiveChar}
            touched={touchedChars}
          />
        )
      }
      center={
        <div className="h-full flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <PreviewCanvas
              preview={preview}
              metadata={metadata}
              nativePath={nativeGlyph}
              viewMode={viewMode}
              groupTopY={showGuides ? groupTopY : undefined}
              showGuides={showGuides}
              zoom={zoom}
            />
          </div>
          {tab === 'characters' && componentCount >= 2 ? (
            <ToneGalleryStrip
              session={session}
              activeChar={activeChar}
              onSelectChar={setActiveChar}
            />
          ) : null}
        </div>
      }
      right={
        <div className="flex flex-col min-h-0">
          {tab === 'marks' ? (
            <MarkInspector
              markId={activeMarkId}
              template={state.templates[activeMarkId]}
              rules={state.rules}
              isUppercase={isUppercase}
              stemWidth={stemWidth}
              onUpdateTemplate={updateTemplate}
              onUpdateRules={updateRules}
              onSetUppercase={setIsUppercase}
              onOpenLibrary={() => setLibraryOpen(true)}
            />
          ) : (
            <ComposeInspector
              char={activeChar}
              componentCount={componentCount}
              override={state.overrides[activeChar]}
              onUpdate={updateOverride}
              onReset={resetOverride}
              onMarkDone={markDone}
            />
          )}
          <div className="p-3 border-t border-neutral-100">
            <p className="text-[11px] font-medium text-neutral-700 mb-1.5">Xuất SVG</p>
            <CopySvgButtons
              composedSvg={svgExports.composed}
              nativeSvg={svgExports.native}
              markSvg={svgExports.mark}
            />
          </div>
        </div>
      }
      statusBar={statusBar}
      dock={dock}
    />
  );

  return (
    <>
      {shell}
      <GlyphLibraryModal
        font={font}
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        markLabel={state.templates[activeMarkId]?.name || activeMarkId}
        onApply={svgPath => updateTemplate(activeMarkId, { svgPath })}
      />
    </>
  );
};
