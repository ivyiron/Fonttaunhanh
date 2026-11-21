import React from 'react';
import { X, RefreshCw } from 'lucide-react';

interface KeepCharsDialogProps {
  open: boolean;
  nativeChars: string[];      // Vietnamese letters the font already has
  regenerateChars: string[];  // of those, the ones rebuilt by the app
  onChange: (chars: string[]) => void;
  onClose: () => void;
}

/** Pick, letter by letter, which of the font's own Vietnamese letters to keep and which to rebuild. */
export const KeepCharsDialog: React.FC<KeepCharsDialogProps> = ({ open, nativeChars, regenerateChars, onChange, onClose }) => {
  if (!open) return null;
  const regen = new Set(regenerateChars);
  const toggle = (ch: string) => {
    const next = new Set(regen);
    if (next.has(ch)) next.delete(ch);
    else next.add(ch);
    onChange(nativeChars.filter((c) => next.has(c)));
  };
  const keptCount = nativeChars.length - nativeChars.filter((c) => regen.has(c)).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1b1b24] border border-neutral-200 dark:border-[#353545] rounded-2xl max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in text-neutral-900 dark:text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 px-5 flex items-start justify-between border-b border-neutral-100 dark:border-[#2a2a36]">
          <div>
            <h3 className="text-base font-extrabold text-neutral-950 dark:text-white">Ký tự đã có trong font</h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Bấm để chuyển giữa giữ bản gốc và làm mới · Giữ {keptCount} · Làm mới {nativeChars.length - keptCount}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 px-5">
          <div className="grid grid-cols-8 gap-1.5">
            {nativeChars.map((ch) => {
              const isRegen = regen.has(ch);
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggle(ch)}
                  title={isRegen ? 'Làm mới' : 'Giữ bản gốc'}
                  className={`relative h-11 rounded-xl border font-mono text-base font-bold transition cursor-pointer ${
                    isRegen
                      ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/60 text-amber-900 dark:text-amber-200'
                      : 'bg-white dark:bg-[#22222c] border-neutral-200 dark:border-[#353545] text-neutral-900 dark:text-neutral-100 hover:border-neutral-400'
                  }`}
                >
                  {ch}
                  {isRegen && <RefreshCw className="w-2.5 h-2.5 absolute top-1 right-1 text-amber-600 dark:text-amber-400" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 px-5 flex items-center justify-between gap-2 border-t border-neutral-100 dark:border-[#2a2a36]">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onChange([])}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-[#353545] text-xs font-bold hover:border-neutral-400 cursor-pointer"
            >
              Giữ tất cả
            </button>
            <button
              type="button"
              onClick={() => onChange([...nativeChars])}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-[#353545] text-xs font-bold hover:border-neutral-400 cursor-pointer"
            >
              Làm mới tất cả
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 dark:bg-amber-500 text-white dark:text-neutral-950 text-xs font-bold cursor-pointer"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};
