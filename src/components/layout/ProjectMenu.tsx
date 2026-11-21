import React, { useEffect, useRef, useState } from 'react';
import { FolderOpen, FolderDown, ChevronDown } from 'lucide-react';
import { VietnameseProjectFile } from '../../types';

interface ProjectMenuProps {
  disabled: boolean;
  onSaveProject: () => void;
  onLoadProject: (project: VietnameseProjectFile) => void;
}

// Header dropdown: save / open a .ftn project.
export const ProjectMenu: React.FC<ProjectMenuProps> = ({ disabled, onSaveProject, onLoadProject }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        onLoadProject(JSON.parse(ev.target?.result as string) as VietnameseProjectFile);
      } catch (err) {
        console.error('Lỗi khi đọc file dự án:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setOpen(false);
  };

  const item =
    'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#2b2b38] text-neutral-800 dark:text-neutral-200 font-bold transition cursor-pointer text-left text-[11px] disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`py-1.5 px-2.5 border text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
          open
            ? 'bg-neutral-200 dark:bg-[#383848] border-neutral-300 dark:border-[#4a4a5e]'
            : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-[#2c2c38] dark:hover:bg-[#383848] border-neutral-200 dark:border-[#3e3e50]'
        } text-neutral-800 dark:text-neutral-100`}
        title="Lưu hoặc mở dự án (.ftn)"
      >
        <FolderOpen className="w-3.5 h-3.5 text-neutral-600 dark:text-amber-400" />
        <span className="hidden sm:inline">Dự án</span>
        <ChevronDown className="w-3 h-3 text-neutral-500" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#22222c] border border-neutral-200 dark:border-[#3a3a4c] rounded-xl shadow-2xl p-1.5 z-50 animate-scale-in">
          <button
            type="button"
            disabled={disabled}
            className={item}
            onClick={() => {
              onSaveProject();
              setOpen(false);
            }}
          >
            <FolderDown className="w-3.5 h-3.5 text-neutral-500 dark:text-amber-400 shrink-0" />
            <span>Lưu dự án (.ftn)</span>
          </button>
          <button type="button" className={item} onClick={() => inputRef.current?.click()}>
            <FolderOpen className="w-3.5 h-3.5 text-neutral-500 dark:text-amber-400 shrink-0" />
            <span>Mở dự án…</span>
          </button>
          <input ref={inputRef} type="file" accept=".ftn,application/json" onChange={handleFile} className="hidden" />
        </div>
      )}
    </div>
  );
};
