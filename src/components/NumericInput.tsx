import React, { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumericInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  unit?: string;
  size?: 'sm' | 'md';
  hideButtons?: boolean;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  className = '',
  inputClassName = '',
  disabled = false,
  placeholder = '0',
  unit,
  size = 'md',
  hideButtons = false,
}) => {
  const [strVal, setStrVal] = useState<string>(() => (value !== undefined && !isNaN(value) ? String(value) : '0'));

  useEffect(() => {
    const parsed = parseFloat(strVal);
    if (!isNaN(value) && value !== parsed) {
      setStrVal(String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setStrVal(raw);

    if (raw === '' || raw === '-') {
      return;
    }

    const num = parseFloat(raw);
    if (!isNaN(num)) {
      let clamped = num;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;
      onChange(clamped);
    }
  };

  const handleBlur = () => {
    if (strVal === '' || strVal === '-' || isNaN(parseFloat(strVal))) {
      setStrVal(String(value ?? 0));
    } else {
      const num = parseFloat(strVal);
      let clamped = num;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;
      setStrVal(String(clamped));
      if (clamped !== value) {
        onChange(clamped);
      }
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const current = isNaN(parseFloat(strVal)) ? (value ?? 0) : parseFloat(strVal);
    let next = current - step;
    if (step < 1) {
      next = Math.round(next * 100) / 100;
    }
    if (min !== undefined && next < min) next = min;
    setStrVal(String(next));
    onChange(next);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const current = isNaN(parseFloat(strVal)) ? (value ?? 0) : parseFloat(strVal);
    let next = current + step;
    if (step < 1) {
      next = Math.round(next * 100) / 100;
    }
    if (max !== undefined && next > max) next = max;
    setStrVal(String(next));
    onChange(next);
  };

  const btnSizeClasses = size === 'sm'
    ? 'w-5 h-5 text-[10px]'
    : 'w-5.5 h-5.5 text-xs';

  const inputSizeClasses = size === 'sm'
    ? 'w-11 sm:w-13 text-xs py-0.5 px-1'
    : 'w-14 sm:w-16 text-xs py-0.5 px-1';

  return (
    <div className={`inline-flex items-center gap-0.5 shrink-0 ${className}`}>
      {!hideButtons && (
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || (min !== undefined && value <= min)}
          className={`${btnSizeClasses} flex items-center justify-center font-bold bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-700 rounded border border-neutral-300 transition disabled:opacity-30 disabled:hover:bg-neutral-100 select-none cursor-pointer shrink-0`}
          title={`Giảm ${step}`}
        >
          <Minus className="w-2.5 h-2.5 stroke-[3]" />
        </button>
      )}

      <input
        type="text"
        inputMode="decimal"
        value={strVal}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={`${inputSizeClasses} text-center font-mono font-bold border border-neutral-300 rounded bg-white text-neutral-900 shadow-2xs focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200 ${inputClassName}`}
      />

      {!hideButtons && (
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && value >= max)}
          className={`${btnSizeClasses} flex items-center justify-center font-bold bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-700 rounded border border-neutral-300 transition disabled:opacity-30 disabled:hover:bg-neutral-100 select-none cursor-pointer shrink-0`}
          title={`Tăng ${step}`}
        >
          <Plus className="w-2.5 h-2.5 stroke-[3]" />
        </button>
      )}

      {unit && <span className="text-[10px] font-mono font-extrabold text-neutral-500 shrink-0 ml-0.5">{unit}</span>}
    </div>
  );
};

