import React, { useState, useEffect } from 'react';
import * as opentype from 'opentype.js';
import {
  DiacriticTemplate,
  AutoPositionRules,
  GlyphOverrideState,
  FontMetadata,
  AutoSpacingRules,
  AutoKerningSettings,
  VietnameseProjectFile,
  CustomGlyphDesign
} from '../../types';
import { StudioHeader, MainTabType } from './StudioHeader';
import { VietnameseStudio } from '../vietnamize/VietnameseStudio';
import { GlyphEditStudio } from '../edit/GlyphEditStudio';
import { KerningStudio } from '../kerning/KerningStudio';
import { StudioFooterPlayground } from './StudioFooterPlayground';
import { ResizableDivider } from '../ResizableDivider';
import { ExportModal } from '../ExportModal';
import { HelpGuideModal } from '../HelpGuideModal';
import { KerningWarningModal } from '../kerning/KerningWarningModal';
import { CreditModal } from '../CreditModal';

interface StudioLayoutProps {
  font: opentype.Font | null;
  rawFontBuffer: ArrayBuffer | null;
  compiledBuffer: ArrayBuffer | null;
  fontFileName: string;
  fontMetadata: FontMetadata | null;

  // Settings & Theme
  isDarkMode: boolean;
  onToggleTheme: (dark: boolean) => void;
  skipVietnamize: boolean;
  onToggleSkipVietnamize: (skip: boolean) => void;
  saveSessionEnabled: boolean;
  onToggleSaveSession: (enabled: boolean) => void;

  // Vietnamize states
  templates: Record<string, DiacriticTemplate>;
  rules: AutoPositionRules;
  overrides: Record<string, GlyphOverrideState>;
  preserveExistingGlyphs: boolean;
  existingGlyphInfo: { count: number; total: number; samples: string[] };

  // Edit states
  customGlyphDesigns: Record<string, CustomGlyphDesign>;

  // Kerning & Spacing states
  spacingRules: AutoSpacingRules;
  kerningSettings: AutoKerningSettings;

  // Font naming & project
  customFamilyName: string;
  customSubfamilyName: string;
  compiling: boolean;

  // Actions
  onUpdateTemplate: (id: string, updates: Partial<DiacriticTemplate>) => void;
  onBatchUpdateTemplates: (newTemplates: Record<string, DiacriticTemplate>) => void;
  onUpdateRules: (updates: Partial<AutoPositionRules>) => void;
  onUpdateOverride: (char: string, updates: Partial<GlyphOverrideState>) => void;
  onBatchUpdateOverrides: (newOverrides: Record<string, GlyphOverrideState>) => void;
  onTogglePreserveExisting: (val: boolean) => void;
  onUpdateCustomGlyphDesign: (key: string, updates: Partial<CustomGlyphDesign>) => void;
  onResetCustomGlyphDesign: (key: string) => void;
  onUpdateSpacingRules: (rules: Partial<AutoSpacingRules>) => void;
  onUpdateKerningSettings: (settings: Partial<AutoKerningSettings>) => void;
  onSetCustomFamilyName: (name: string) => void;
  onSetCustomSubfamilyName: (sub: string) => void;
  onCompileFont: () => void;
  onDownloadFont: (format: 'ttf' | 'woff2' | 'otf') => void;
  onSaveProject: () => void;
  onLoadProject: (project: VietnameseProjectFile) => void;
  onUploadNewFont: () => void;
}

export const StudioLayout: React.FC<StudioLayoutProps> = ({
  font,
  rawFontBuffer,
  compiledBuffer,
  fontFileName,
  fontMetadata,
  isDarkMode,
  onToggleTheme,
  skipVietnamize,
  onToggleSkipVietnamize,
  saveSessionEnabled,
  onToggleSaveSession,
  templates,
  rules,
  overrides,
  preserveExistingGlyphs,
  existingGlyphInfo,
  customGlyphDesigns,
  spacingRules,
  kerningSettings,
  customFamilyName,
  customSubfamilyName,
  compiling,
  onUpdateTemplate,
  onBatchUpdateTemplates,
  onUpdateRules,
  onUpdateOverride,
  onBatchUpdateOverrides,
  onTogglePreserveExisting,
  onUpdateCustomGlyphDesign,
  onResetCustomGlyphDesign,
  onUpdateSpacingRules,
  onUpdateKerningSettings,
  onSetCustomFamilyName,
  onSetCustomSubfamilyName,
  onCompileFont,
  onDownloadFont,
  onSaveProject,
  onLoadProject,
  onUploadNewFont
}) => {
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>(() => {
    return skipVietnamize ? 'glyph-edit' : 'vietnamize';
  });
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showCreditModal, setShowCreditModal] = useState<boolean>(false);
  const [showKerningWarningModal, setShowKerningWarningModal] = useState<boolean>(false);
  const [dontShowKerningWarning, setDontShowKerningWarning] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hide_kerning_warning') === 'true';
    } catch {
      return false;
    }
  });

  // If user turns on skipVietnamize while currently on vietnamize tab, auto-switch to glyph-edit
  useEffect(() => {
    if (skipVietnamize && activeMainTab === 'vietnamize') {
      setActiveMainTab('glyph-edit');
    }
  }, [skipVietnamize, activeMainTab]);

  const handleSelectTab = (tab: MainTabType) => {
    if (skipVietnamize && tab === 'vietnamize') {
      return; // Disabled when skipVietnamize is checked
    }
    if (tab === 'kerning' && activeMainTab !== 'kerning' && !dontShowKerningWarning) {
      setShowKerningWarningModal(true);
    } else {
      setActiveMainTab(tab);
    }
  };

  const handleDismissKerningWarningForever = () => {
    setDontShowKerningWarning(true);
    try {
      localStorage.setItem('hide_kerning_warning', 'true');
    } catch {
      // ignore
    }
  };

  // Footer playground sizing for Tab 1
  const [footerHeight, setFooterHeight] = useState<number>(300);
  const [isFooterCollapsed, setIsFooterCollapsed] = useState<boolean>(false);

  const handleFooterResize = (delta: number) => {
    if (isFooterCollapsed) {
      setIsFooterCollapsed(false);
    }
    // delta is positive when dragging downwards, so we subtract delta to increase height
    setFooterHeight((prev) => Math.min(450, Math.max(250, prev - delta)));
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 font-sans antialiased text-neutral-900 dark:text-neutral-100 select-none transition-colors">
      {/* 1. Global Header */}
      <StudioHeader
        activeTab={activeMainTab}
        setActiveTab={handleSelectTab}
        font={font}
        fontMetadata={fontMetadata}
        fontFileName={fontFileName}
        onUploadNewFont={onUploadNewFont}
        onOpenHelp={() => setShowHelpModal(true)}
        onCompileFont={onCompileFont}
        compiling={compiling}
        onOpenExport={() => setShowExportModal(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        skipVietnamize={skipVietnamize}
        onToggleSkipVietnamize={onToggleSkipVietnamize}
        saveSessionEnabled={saveSessionEnabled}
        onToggleSaveSession={onToggleSaveSession}
        onOpenCredit={() => setShowCreditModal(true)}
      />

      {/* 2. Main Studio Canvas Area */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
        {activeMainTab === 'vietnamize' ? (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Top Area: 3 Panels (Left, Canvas, Right) */}
            <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
              <VietnameseStudio
                font={font}
                fontMetadata={fontMetadata}
                templates={templates}
                rules={rules}
                overrides={overrides}
                preserveExistingGlyphs={preserveExistingGlyphs}
                existingGlyphInfo={existingGlyphInfo}
                onTogglePreserveExisting={onTogglePreserveExisting}
                onUpdateTemplate={onUpdateTemplate}
                onUpdateRules={onUpdateRules}
                onUpdateOverride={onUpdateOverride}
                onResetOverride={(char) => {
                  onUpdateOverride(char, {
                    offsetX: 0,
                    offsetY: 0,
                    scaleX: 1.0,
                    scaleY: 1.0,
                    advanceWidthTweak: 0,
                    isCompleted: false
                  });
                }}
                onBatchApproveOverrides={() => {
                  onBatchUpdateOverrides((prev) => {
                    const next = { ...prev };
                    Object.keys(next).forEach((k) => {
                      next[k] = { ...next[k], isCompleted: true };
                    });
                    return next;
                  });
                }}
              />
            </div>

            {/* Vertical Resizable Divider for Footer */}
            <ResizableDivider
              direction="vertical"
              onResize={handleFooterResize}
            />

            {/* Bottom Area: Full-width Trình Gõ Thử Font */}
            <div
              style={{ height: isFooterCollapsed ? '44px' : `${footerHeight}px` }}
              className="shrink-0 transition-[height] duration-150 ease-out"
            >
              <StudioFooterPlayground
                fontBuffer={compiledBuffer || rawFontBuffer}
                fontFamilyName="VietnameseizedFontPreview"
                isCollapsed={isFooterCollapsed}
                onToggleCollapse={() => setIsFooterCollapsed(!isFooterCollapsed)}
              />
            </div>
          </div>
        ) : activeMainTab === 'glyph-edit' ? (
          /* Tab 2: Edit Tàu Nhanh (3 panels: Left Glyphs List, Middle Guideline Canvas, Right SVG & Transform + Bottom Playground) */
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 flex overflow-hidden min-h-0">
              <GlyphEditStudio
                font={font}
                rawFontBuffer={rawFontBuffer}
                compiledBuffer={compiledBuffer}
                fontMetadata={fontMetadata}
                customDesigns={customGlyphDesigns}
                onUpdateCustomDesign={onUpdateCustomGlyphDesign}
                onResetCustomDesign={onResetCustomGlyphDesign}
                onCompileFont={onCompileFont}
                compiling={compiling}
              />
            </div>

            {/* Vertical Resizable Divider for Footer */}
            <ResizableDivider
              direction="vertical"
              onResize={handleFooterResize}
            />

            {/* Bottom Area: Full-width Trình Gõ Thử Font */}
            <div
              style={{ height: isFooterCollapsed ? '44px' : `${footerHeight}px` }}
              className="shrink-0 transition-[height] duration-150 ease-out"
            >
              <StudioFooterPlayground
                fontBuffer={compiledBuffer || rawFontBuffer}
                fontFamilyName="VietnameseizedFontPreview"
                isCollapsed={isFooterCollapsed}
                onToggleCollapse={() => setIsFooterCollapsed(!isFooterCollapsed)}
              />
            </div>
          </div>
        ) : (
          /* Tab 3: Kerning Tàu Nhanh (3 panels: Left, Middle, Right) */
          <div className="flex-1 flex overflow-hidden min-h-0">
            <KerningStudio
              font={font}
              rawFontBuffer={rawFontBuffer}
              compiledBuffer={compiledBuffer}
              fontMetadata={fontMetadata}
              spacingRules={spacingRules}
              kerningSettings={kerningSettings}
              onUpdateSpacingRules={onUpdateSpacingRules}
              onUpdateKerningSettings={onUpdateKerningSettings}
              onCompileFont={onCompileFont}
              compiling={compiling}
            />
          </div>
        )}
      </main>

      {/* 3. Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        font={font}
        fontMetadata={fontMetadata}
        fontFileName={fontFileName}
        compiledBuffer={compiledBuffer}
        customFamilyName={customFamilyName}
        customSubfamilyName={customSubfamilyName}
        onSetCustomFamilyName={onSetCustomFamilyName}
        onSetCustomSubfamilyName={onSetCustomSubfamilyName}
        onCompileFont={onCompileFont}
        compiling={compiling}
        onDownloadFont={onDownloadFont}
        onSaveProject={onSaveProject}
        onLoadProject={onLoadProject}
      />

      {/* 4. Help Guide Modal */}
      {showHelpModal && (
        <HelpGuideModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
      )}

      {/* 5. Kerning Warning Modal */}
      <KerningWarningModal
        isOpen={showKerningWarningModal}
        onClose={() => setShowKerningWarningModal(false)}
        onConfirm={() => {
          setShowKerningWarningModal(false);
          setActiveMainTab('kerning');
        }}
        onDismissForever={handleDismissKerningWarningForever}
      />

      {/* 6. Credit & Disclaimer Modal */}
      {showCreditModal && (
        <CreditModal
          isOpen={showCreditModal}
          onClose={() => setShowCreditModal(false)}
        />
      )}
    </div>
  );
};
