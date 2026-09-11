import React, { useCallback, useMemo, useState } from 'react';
import type * as opentype from 'opentype.js';
import type { AutoSpacingRules, AutoKerningSettings } from '../../core/session';
import {
  buildKerningPlan,
  type InterventionLevel,
  type KerningPlan,
  type PairEntry
} from '../../core/index';

import { StudioShell } from '../../ui/shell/StudioShell';
import { PairListPanel } from './panels/PairListPanel';
import { KerningProof } from './panels/KerningProof';
import { KerningInspector } from './panels/KerningInspector';

export interface KerningState {
  level: InterventionLevel;
  settings: AutoKerningSettings;
  spacing: AutoSpacingRules;
  /** Keyed "leftChar,rightChar". */
  manualPairs: Record<string, number>;
  approvedRepairs: string[];
}

export const defaultKerningState = (): KerningState => ({
  // Level 1 is the default because it extends the designer's intent onto
  // characters they never drew without changing a single pair they did.
  level: 1,
  settings: {
    intensityMultiplier: 1.0,
    minThreshold: 10,
    applyClassics: true,
    applyUpperLower: true,
    applyPunctuation: true,
    applyNumbers: true,
    applyVietnameseVariants: true,
    customPairs: {}
  },
  spacing: {
    spacingPreset: 'normal',
    globalTrackingOffset: 0,
    curveTighteningPercent: 0,
    applyToLatin: false,
    applyToVietnamese: false,
    applyToNumbers: false,
    applyToPunctuation: false
  },
  manualPairs: {},
  approvedRepairs: []
});

interface KerningToolProps {
  /** Font WITH the generated glyphs already in it, so level 1 can see them. */
  font: opentype.Font;
  compiledBuffer: ArrayBuffer | null;
  fontFamilyName: string;
  state: KerningState;
  onStateChange: (patch: Partial<KerningState>) => void;
  onPlanChange?: (plan: KerningPlan) => void;
  header: React.ReactNode;
  statusBar: React.ReactNode;
}

export const KerningTool: React.FC<KerningToolProps> = ({
  font, compiledBuffer, fontFamilyName, state, onStateChange, onPlanChange,
  header, statusBar
}) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const approved = useMemo(() => new Set(state.approvedRepairs), [state.approvedRepairs]);

  const plan = useMemo(() => {
    const p = buildKerningPlan({
      font,
      level: state.level,
      settings: state.settings,
      manualPairs: state.manualPairs,
      approvedRepairs: state.level >= 2 ? approved : undefined
    });
    onPlanChange?.(p);
    return p;
  }, [font, state.level, state.settings, state.manualPairs, approved]);

  // The flagged list must show every collision found, not only approved ones,
  // otherwise there is nothing to approve.
  const listEntries = useMemo(() => {
    if (state.level < 2) return plan.entries;
    const full = buildKerningPlan({
      font,
      level: state.level,
      settings: state.settings,
      manualPairs: state.manualPairs
    });
    const byKey = new Map(plan.entries.map(e => [e.key, e]));
    for (const e of full.entries) {
      if (e.origin === 'repair' && !byKey.has(e.key)) byKey.set(e.key, e);
      else if (e.origin === 'repair') byKey.set(e.key, e);
    }
    return [...byKey.values()];
  }, [plan, font, state.level, state.settings, state.manualPairs]);

  const active: PairEntry | null = useMemo(
    () => listEntries.find(e => e.key === activeKey)
      ?? listEntries.find(e => e.origin === 'repair')
      ?? listEntries[0]
      ?? null,
    [listEntries, activeKey]
  );

  const toggleRepair = useCallback((key: string) => {
    const next = new Set(state.approvedRepairs);
    if (next.has(key)) next.delete(key); else next.add(key);
    onStateChange({ approvedRepairs: [...next] });
  }, [state.approvedRepairs, onStateChange]);

  const setPairValue = useCallback((value: number) => {
    if (!active) return;
    onStateChange({
      manualPairs: { ...state.manualPairs, [`${active.leftChar},${active.rightChar}`]: value }
    });
  }, [active, state.manualPairs, onStateChange]);

  return (
    <StudioShell
      leftWidth="wide"
      rightWidth="wide"
      header={header}
      statusBar={statusBar}
      // No dock: the canvas already is the proof. Kerning cannot be judged on a
      // single glyph, so a separate glyph preview strip would be dead space.
      left={
        <PairListPanel
          entries={listEntries}
          activeKey={active?.key ?? null}
          onSelectPair={e => setActiveKey(e.key)}
          approvedRepairs={approved}
          onToggleRepair={toggleRepair}
        />
      }
      center={
        active ? (
          <KerningProof
            font={font}
            compiledBuffer={compiledBuffer}
            fontFamilyName={fontFamilyName}
            leftChar={active.leftChar}
            rightChar={active.rightChar}
            value={active.value}
            previousValue={active.previousValue}
            onChangeValue={setPairValue}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-neutral-400">
            Font này chưa có cặp kerning nào. Thử mức 3 để dựng lại từ đầu.
          </div>
        )
      }
      right={
        <KerningInspector
          level={state.level}
          onSetLevel={level => onStateChange({ level })}
          plan={plan}
          settings={state.settings}
          onUpdateSettings={patch => onStateChange({ settings: { ...state.settings, ...patch } })}
          spacing={state.spacing}
          onUpdateSpacing={patch => onStateChange({ spacing: { ...state.spacing, ...patch } })}
        />
      }
    />
  );
};
