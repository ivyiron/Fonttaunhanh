import { useState, useCallback, useEffect, useMemo } from 'react';
import * as opentype from 'opentype.js';
import { AlertTriangle, Check, X, Edit2 } from 'lucide-react';

import { StudioShell } from './ui/shell/StudioShell';
import { StudioHeader } from './ui/shell/StudioHeader';
import { FontUploader } from './ui/shell/FontUploader';
import { StatusBar, type InterventionCounters } from './ui/shell/StatusBar';
import { GlyphCanvas } from './ui/glyph/GlyphCanvas';
import { FontPlayground } from './ui/preview/FontPlayground';

import { GlyphListPanel } from './tools/editor/panels/GlyphListPanel';
import { OutlineInspector } from './tools/editor/panels/OutlineInspector';
import { VietHoaTool, defaultVietHoaState, type VietHoaState } from './tools/viethoa/VietHoaTool';
import { KerningTool, defaultKerningState, type KerningState } from './tools/kerning/KerningTool';

import type { GlyphEditState, FontMetadata, FontGlyphItem } from './core/session';
import {
  compileEditedFont,
  compileVietnameseFont,
  createPreviewSession,
  flushPreviewSession,
  type KerningPlan,
  ensureKerningPairsPopulated,
  getGlyphsFromFont,
  getNextAvailablePuaCodepoint
} from './core/index';
import { TOOLS, type ToolId } from './app/tools';

export default function App() {
  const [originalFont, setOriginalFont] = useState<opentype.Font | null>(null);
  const [rawFontBuffer, setRawFontBuffer] = useState<ArrayBuffer | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<FontMetadata | null>(null);

  const [activeTool, setActiveTool] = useState<ToolId>('editor');
  const [editedGlyphs, setEditedGlyphs] = useState<Record<string, GlyphEditState>>({});
  const [activeGlyphId, setActiveGlyphId] = useState<string | null>(null);
  const [dockExpanded, setDockExpanded] = useState(true);

  const [compiledBuffer, setCompiledBuffer] = useState<ArrayBuffer | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [counters, setCounters] = useState<InterventionCounters>(emptyCounters);
  const [appError, setAppError] = useState<string | null>(null);
  const [appSuccess, setAppSuccess] = useState<string | null>(null);

  const [vietState, setVietState] = useState<VietHoaState>(defaultVietHoaState);
  const [kerningState, setKerningState] = useState<KerningState>(defaultKerningState);
  const [kerningPlan, setKerningPlan] = useState<KerningPlan | null>(null);
  const [customFamilyName, setCustomFamilyName] = useState('');
  const [customSubfamilyName, setCustomSubfamilyName] = useState('');

  useEffect(() => {
    if (!appSuccess) return;
    const t = setTimeout(() => setAppSuccess(null), 5000);
    return () => clearTimeout(t);
  }, [appSuccess]);

  useEffect(() => {
    if (!appError) return;
    const t = setTimeout(() => setAppError(null), 7000);
    return () => clearTimeout(t);
  }, [appError]);

  const handleFontLoaded = useCallback((
    loadedFont: opentype.Font,
    nameOfFile: string,
    meta: FontMetadata,
    rawBuffer: ArrayBuffer
  ) => {
    ensureKerningPairsPopulated(loadedFont);
    setOriginalFont(loadedFont);
    setRawFontBuffer(rawBuffer);
    setFilename(nameOfFile);
    setMetadata(meta);
    setCustomFamilyName(`${meta.family} Edited`);
    setCustomSubfamilyName(meta.subfamily || 'Regular');
    setEditedGlyphs({});
    setActiveGlyphId(null);
    setCompiledBuffer(null);
    setVietState(defaultVietHoaState());
    setKerningState(defaultKerningState());
    setKerningPlan(null);
    setCounters({ ...emptyCounters, originalPairsKept: Object.keys((loadedFont as any).kerningPairs ?? {}).length });
  }, []);

  const handleReset = useCallback(() => {
    setOriginalFont(null);
    setRawFontBuffer(null);
    setFilename(null);
    setMetadata(null);
    setEditedGlyphs({});
    setActiveGlyphId(null);
    setCompiledBuffer(null);
    setCounters(emptyCounters);
  }, []);

  // Level 1 inheritance has to see the generated Vietnamese glyphs, so the
  // Kerning tool works on a preview session rather than the pristine font.
  const kerningFont = useMemo(() => {
    if (activeTool !== 'kerning' || !rawFontBuffer) return null;
    const s = createPreviewSession({
      rawFontBuffer,
      templates: vietState.templates,
      rules: vietState.rules,
      overrides: vietState.overrides,
      preserveExistingGlyphs: vietState.preserveExistingGlyphs
    });
    flushPreviewSession(s);
    return s.font;
  }, [activeTool, rawFontBuffer, vietState]);

  const allGlyphs = useMemo(
    () => (originalFont ? getGlyphsFromFont(originalFont) : []),
    [originalFont]
  );

  const handleSelectGlyph = useCallback((glyph: FontGlyphItem) => {
    const id = `glyph_${glyph.index}`;
    setActiveGlyphId(id);
    setEditedGlyphs(prev => {
      if (prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          id,
          originalGlyphIndex: glyph.index,
          originalName: glyph.name,
          originalUnicode: glyph.unicode,
          originalChar: glyph.char,
          originalPath: glyph.svgPath,
          originalAdvanceWidth: glyph.advanceWidth,
          mode: 'replace',
          altName: `${glyph.name}.alt`,
          altUnicode: originalFont
            ? getNextAvailablePuaCodepoint(originalFont, new Set(
                (Object.values(prev) as GlyphEditState[]).map(s => s.altUnicode).filter(Boolean)
              ))
            : 0xE000,
          svgPath: glyph.svgPath,
          scaleX: 1,
          scaleY: 1,
          offsetX: 0,
          offsetY: 0,
          flipY: false,
          advanceWidth: glyph.advanceWidth,
          inheritKerning: true,
          trackingOffset: 0,
          isCompleted: false,
          isModified: false
        }
      };
    });
  }, [originalFont]);

  const handleUpdateGlyphState = useCallback((id: string, updated: Partial<GlyphEditState>) => {
    setEditedGlyphs(prev => {
      const current = prev[id];
      if (!current) return prev;
      return { ...prev, [id]: { ...current, ...updated, isModified: true } };
    });
  }, []);

  const handleSaveSlot = useCallback((id: string) => {
    setEditedGlyphs(prev => (prev[id] ? { ...prev, [id]: { ...prev[id], isCompleted: true } } : prev));
    setAppSuccess('Đã đánh dấu ký tự là hoàn tất.');
  }, []);

  const handleResetSlot = useCallback((id: string) => {
    setEditedGlyphs(prev => {
      const s = prev[id];
      if (!s) return prev;
      return {
        ...prev,
        [id]: {
          ...s,
          svgPath: s.originalPath,
          scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0, flipY: false,
          advanceWidth: s.originalAdvanceWidth,
          trackingOffset: 0,
          isCompleted: false, isModified: false
        }
      };
    });
  }, []);

  const handleCompile = useCallback(async (download = false) => {
    if (!rawFontBuffer) return;
    setCompiling(true);
    setAppError(null);
    try {
      if (activeTool === 'kerning' && kerningFont) {
    const r = kerningPlan?.report;
    return (
      <>
        <Alerts error={appError} success={appSuccess} onClearError={() => setAppError(null)} onClearSuccess={() => setAppSuccess(null)} />
        <KerningTool
          font={kerningFont}
          compiledBuffer={compiledBuffer}
          fontFamilyName={customFamilyName || 'EditedFont'}
          state={kerningState}
          onStateChange={patch => setKerningState(prev => ({ ...prev, ...patch }))}
          onPlanChange={setKerningPlan}
          header={header}
          statusBar={
            <StatusBar counters={{
              originalPairsKept: r?.originalPairsKept ?? 0,
              pairsAddedForNewGlyphs: (r?.pairsAddedForNewGlyphs ?? 0) + (r?.pairsRebuilt ?? 0),
              originalPairsOverwritten: r?.originalPairsOverwritten ?? 0,
              glyphsWithChangedAdvance: kerningState.spacing.applyToLatin || kerningState.spacing.applyToVietnamese
                ? kerningFont.glyphs.length : 0,
              glyphsReplaced: 0,
              glyphsAdded: 0
            }} />
          }
        />
      </>
    );
  }

  if (activeTool === 'viethoa') {
        const buffer = compileVietnameseFont({
          rawFontBuffer,
          templates: vietState.templates,
          rules: vietState.rules,
          overrides: vietState.overrides,
          preserveExistingGlyphs: vietState.preserveExistingGlyphs,
          spacingRules: vietState.spacingRules ?? kerningState.spacing,
          kerningSettings: kerningState.settings,
          manualKerning: {},
          customFamilyName,
          customSubfamilyName
        });
        setCompiledBuffer(buffer);
        setCounters({
          ...emptyCounters,
          originalPairsKept: counters.originalPairsKept,
          glyphsAdded: 134
        });
        if (download) downloadBuffer(buffer, customFamilyName || 'VietnameseFont');
        setAppSuccess(download ? 'Đã tải font xuống.' : 'Đã biên dịch. Thử ở khung bên dưới.');
        return;
      }

      const result = compileEditedFont({
        rawFontBuffer,
        editedGlyphs,
        customFamilyName,
        customSubfamilyName
      });
      setCompiledBuffer(result.buffer);
      setCounters({
        originalPairsKept: result.kerningPairs,
        pairsAddedForNewGlyphs: 0,
        originalPairsOverwritten: 0,
        glyphsWithChangedAdvance: (Object.values(editedGlyphs) as GlyphEditState[])
          .filter(g => g.isModified && g.advanceWidth !== g.originalAdvanceWidth).length,
        glyphsReplaced: result.replaced,
        glyphsAdded: result.added
      });

      if (download) {
        downloadBuffer(result.buffer, customFamilyName || 'EditedFont');
        setAppSuccess('Đã đóng gói và tải font xuống.');
      } else {
        setAppSuccess('Đã biên dịch. Thử ngay ở khung bên dưới.');
      }
    } catch (err: any) {
      console.error(err);
      setAppError(err?.message ?? 'Biên dịch thất bại.');
    } finally {
      setCompiling(false);
    }
  }, [rawFontBuffer, editedGlyphs, customFamilyName, customSubfamilyName, activeTool, vietState, kerningState, counters.originalPairsKept]);

  const activeEditState = activeGlyphId ? editedGlyphs[activeGlyphId] : null;
  const activeIndexInList = activeEditState
    ? allGlyphs.findIndex(g => g.index === activeEditState.originalGlyphIndex)
    : -1;

  const step = useCallback((delta: number) => {
    const next = allGlyphs[activeIndexInList + delta];
    if (next) handleSelectGlyph(next);
  }, [allGlyphs, activeIndexInList, handleSelectGlyph]);

  if (!originalFont || !metadata || !rawFontBuffer) {
    return (
      <div className="min-h-screen bg-neutral-50/60 text-neutral-900 font-sans flex flex-col justify-center items-center p-6">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-neutral-900 text-white rounded-2xl shadow-sm mb-1">
              <Edit2 className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Nền tảng chỉnh sửa font</h1>
            <p className="text-sm text-neutral-500 max-w-md mx-auto">
              Một font, ba công cụ, một đường xuất file. Nạp font để bắt đầu.
            </p>
          </div>
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm">
            <FontUploader
              onFontLoaded={handleFontLoaded}
              onReset={handleReset}
              metadata={metadata}
              filename={filename}
            />
          </div>
        </div>
      </div>
    );
  }

  const header = (
    <div className="shrink-0">
      <ToolSwitcher active={activeTool} onSelect={setActiveTool} />
      <StudioHeader
        metadata={metadata}
        filename={filename}
        customFamilyName={customFamilyName}
        setCustomFamilyName={setCustomFamilyName}
        customSubfamilyName={customSubfamilyName}
        setCustomSubfamilyName={setCustomSubfamilyName}
        editedGlyphs={editedGlyphs}
        compiling={compiling}
        onCompileFont={handleCompile}
        onResetFont={handleReset}
      />
    </div>
  );

  const dock = (
    <FontPlayground
      fontBuffer={compiledBuffer}
      originalBuffer={rawFontBuffer}
      editedGlyphs={editedGlyphs}
      fontFamilyName={customFamilyName || 'EditedFont'}
      isExpanded={dockExpanded}
      onToggleExpanded={() => setDockExpanded(v => !v)}
    />
  );

  if (activeTool === 'kerning' && kerningFont) {
    const r = kerningPlan?.report;
    return (
      <>
        <Alerts error={appError} success={appSuccess} onClearError={() => setAppError(null)} onClearSuccess={() => setAppSuccess(null)} />
        <KerningTool
          font={kerningFont}
          compiledBuffer={compiledBuffer}
          fontFamilyName={customFamilyName || 'EditedFont'}
          state={kerningState}
          onStateChange={patch => setKerningState(prev => ({ ...prev, ...patch }))}
          onPlanChange={setKerningPlan}
          header={header}
          statusBar={
            <StatusBar counters={{
              originalPairsKept: r?.originalPairsKept ?? 0,
              pairsAddedForNewGlyphs: (r?.pairsAddedForNewGlyphs ?? 0) + (r?.pairsRebuilt ?? 0),
              originalPairsOverwritten: r?.originalPairsOverwritten ?? 0,
              glyphsWithChangedAdvance: kerningState.spacing.applyToLatin || kerningState.spacing.applyToVietnamese
                ? kerningFont.glyphs.length : 0,
              glyphsReplaced: 0,
              glyphsAdded: 0
            }} />
          }
        />
      </>
    );
  }

  if (activeTool === 'viethoa') {
    return (
      <>
        <Alerts error={appError} success={appSuccess} onClearError={() => setAppError(null)} onClearSuccess={() => setAppSuccess(null)} />
        <VietHoaTool
          font={originalFont}
          metadata={metadata}
          rawFontBuffer={rawFontBuffer}
          state={vietState}
          onStateChange={patch => setVietState(prev => ({ ...prev, ...patch }))}
          header={header}
          statusBar={<StatusBar counters={counters} />}
          dock={dock}
          dockExpanded={dockExpanded}
        />
      </>
    );
  }

  return (
    <>
      <Alerts error={appError} success={appSuccess} onClearError={() => setAppError(null)} onClearSuccess={() => setAppSuccess(null)} />
      <StudioShell
        leftWidth="wide"
        rightWidth="wide"
        dockExpanded={dockExpanded}
        header={header}
        left={
          <GlyphListPanel
            font={originalFont}
            fontMetadata={metadata}
            editedGlyphs={editedGlyphs}
            onSelectGlyph={handleSelectGlyph}
            activeGlyphId={activeGlyphId}
          />
        }
        center={
          activeEditState ? (
            <GlyphCanvas
              font={originalFont}
              fontMetadata={metadata}
              editState={activeEditState}
              onUpdateState={handleUpdateGlyphState}
              onSelectPrevGlyph={() => step(-1)}
              onSelectNextGlyph={() => step(1)}
              hasPrevGlyph={activeIndexInList > 0}
              hasNextGlyph={activeIndexInList >= 0 && activeIndexInList < allGlyphs.length - 1}
            />
          ) : (
            <EmptyCanvas />
          )
        }
        right={
          activeEditState ? (
            <OutlineInspector
              font={originalFont}
              fontMetadata={metadata}
              editState={activeEditState}
              onUpdateState={handleUpdateGlyphState}
              onSaveSlot={handleSaveSlot}
              onResetSlot={handleResetSlot}
            />
          ) : (
            <div className="p-4 text-xs text-neutral-400">Chọn một ký tự để chỉnh sửa.</div>
          )
        }
        statusBar={<StatusBar counters={counters} />}
        dock={dock}
      />
    </>
  );
}

function downloadBuffer(buffer: ArrayBuffer, name: string) {
  const blob = new Blob([buffer], { type: 'font/opentype' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/[^a-zA-Z0-9-]/g, '_')}.otf`;
  a.click();
  URL.revokeObjectURL(url);
}

const emptyCounters: InterventionCounters = {
  originalPairsKept: 0,
  pairsAddedForNewGlyphs: 0,
  originalPairsOverwritten: 0,
  glyphsWithChangedAdvance: 0,
  glyphsReplaced: 0,
  glyphsAdded: 0
};

function ToolSwitcher({ active, onSelect }: { active: ToolId; onSelect: (id: ToolId) => void }) {
  return (
    <div className="flex items-center gap-1 px-6 pt-3 pb-0 bg-neutral-50/50 border-b border-neutral-100">
      {TOOLS.map(tool => {
        const isActive = tool.id === active;
        return (
          <button
            key={tool.id}
            disabled={!tool.available}
            onClick={() => tool.available && onSelect(tool.id)}
            title={tool.available ? undefined : 'Chưa chuyển sang nền tảng mới'}
            className={[
              'px-3.5 py-2 text-xs font-medium rounded-t-lg border border-b-0 -mb-px transition',
              isActive
                ? 'bg-white border-neutral-200 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800',
              tool.available ? '' : 'opacity-40 cursor-not-allowed'
            ].join(' ')}
          >
            {tool.label}
          </button>
        );
      })}
    </div>
  );
}

function EmptyCanvas() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-50/50 p-6 text-center">
      <Edit2 className="w-8 h-8 text-neutral-300 mb-2" />
      <p className="text-sm font-medium text-neutral-700">Chưa chọn ký tự nào</p>
      <p className="text-xs text-neutral-400 max-w-xs mt-1">
        Chọn một ký tự ở danh sách bên trái để bắt đầu chỉnh sửa.
      </p>
    </div>
  );
}

function Alerts({ error, success, onClearError, onClearSuccess }: {
  error: string | null; success: string | null;
  onClearError: () => void; onClearSuccess: () => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0 pointer-events-none">
      {error && (
        <div className="pointer-events-auto flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl shadow-lg relative">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="pr-5">
            <p className="font-semibold">Lỗi thao tác</p>
            <p className="text-[11px] text-red-700/90 mt-0.5">{error}</p>
          </div>
          <button onClick={onClearError} className="absolute top-2.5 right-2.5 text-red-400 hover:text-red-700 p-1 rounded-lg">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {success && (
        <div className="pointer-events-auto flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl shadow-lg relative">
          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="pr-5">
            <p className="font-semibold">Thông báo</p>
            <p className="text-[11px] text-emerald-700/90 mt-0.5">{success}</p>
          </div>
          <button onClick={onClearSuccess} className="absolute top-2.5 right-2.5 text-emerald-400 hover:text-emerald-700 p-1 rounded-lg">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
