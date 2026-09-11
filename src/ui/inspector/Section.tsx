import React, { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Progressive disclosure, as a primitive. The inspector defaults to three or four
// controls; everything else lives behind a collapsed section. A user who never
// opens one never learns the tool has twenty sliders.

interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Advanced sections are collapsed by default and rendered quieter. */
  advanced?: boolean;
}

export const Section: React.FC<SectionProps> = ({
  title, subtitle, children, defaultOpen, advanced = false
}) => {
  const [open, setOpen] = useState(defaultOpen ?? !advanced);
  const Icon = open ? ChevronDown : ChevronRight;

  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-1.5 px-3 py-2.5 text-left hover:bg-neutral-50 transition"
      >
        <Icon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <span className={advanced ? 'text-xs text-neutral-500' : 'text-xs font-medium text-neutral-800'}>
          {title}
        </span>
        {subtitle ? <span className="ml-auto text-[10px] text-neutral-400">{subtitle}</span> : null}
      </button>
      {open ? <div className="px-3 pb-3 space-y-2.5">{children}</div> : null}
    </div>
  );
};

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, hint, children }) => (
  <div className="flex items-center gap-2">
    <label className="text-[11px] text-neutral-600 flex-1 min-w-0" title={hint}>{label}</label>
    <div className="shrink-0">{children}</div>
  </div>
);
