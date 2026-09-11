import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

// The handover in the other direction: take what this app generated out to
// Illustrator or Figma, fix it by hand, paste it back through SvgPasteCard.

interface CopySvgButtonsProps {
  /** Full <svg> of the glyph this app composed. */
  composedSvg?: string;
  /** Full <svg> of the font's own glyph, when it has one. */
  nativeSvg?: string;
  /** Just the diacritic outline, without the base letter. */
  markSvg?: string;
}

export const CopySvgButtons: React.FC<CopySvgButtonsProps> = ({ composedSvg, nativeSvg, markSvg }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  const items: [string, string, string | undefined][] = [
    ['composed', 'Chép SVG dựng mới', composedSvg],
    ['native', 'Chép SVG glyph gốc', nativeSvg],
    ['mark', 'Chép SVG riêng dấu', markSvg]
  ];

  return (
    <div className="flex flex-col gap-1">
      {items.map(([key, label, value]) => (
        <button
          key={key}
          disabled={!value}
          onClick={() => copy(key, value)}
          className={[
            'flex items-center gap-1.5 px-2 py-1.5 text-[11px] rounded-lg border transition text-left',
            value
              ? 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400'
              : 'bg-neutral-50 border-neutral-100 text-neutral-300 cursor-not-allowed'
          ].join(' ')}
        >
          {copied === key
            ? <Check className="w-3 h-3 text-emerald-600 shrink-0" />
            : <Copy className="w-3 h-3 shrink-0" />}
          <span className="truncate">{copied === key ? 'Đã chép' : label}</span>
        </button>
      ))}
    </div>
  );
};
