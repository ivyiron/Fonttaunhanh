import React from 'react';

// The repo's on/off switch (same look as "Chỉnh riêng cho ký tự này"). Put it inside a <label>.
export const Switch: React.FC<{ checked: boolean; onChange: (on: boolean) => void; small?: boolean }> = ({
  checked,
  onChange,
  small
}) => (
  <span className="relative inline-flex items-center shrink-0">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
    <span
      className={`${small ? 'w-7 h-4 after:h-3 after:w-3' : 'w-9 h-5 after:h-4 after:w-4'} bg-neutral-300 dark:bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:transition-all peer-checked:bg-neutral-900 dark:peer-checked:bg-amber-500`}
    />
  </span>
);
