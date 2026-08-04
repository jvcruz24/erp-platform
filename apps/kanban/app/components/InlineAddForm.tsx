'use client';
import { useState } from 'react';
import { X } from 'lucide-react';

interface InlineAddFormProps {
  placeholder: string;
  submitLabel: string;
  maxLength: number;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  inputClassName?: string;
}

/**
 * The original component duplicated this exact "input + submit + cancel"
 * pattern for both "add ticket" and "add column". Extracting it once means
 * validation (trim, maxLength) and keyboard handling (Enter/Escape) live in
 * one place (DRY).
 */
export function InlineAddForm({
  placeholder,
  submitLabel,
  maxLength,
  onSubmit,
  onCancel,
  inputClassName = 'text-sm',
}: InlineAddFormProps) {
  const [value, setValue] = useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
    setValue('');
  };

  return (
    <div className='mt-1.5 flex items-center gap-1.5'>
      <input
        autoFocus
        value={value}
        maxLength={maxLength}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') onCancel();
        }}
        placeholder={placeholder}
        className={`w-full outline-none placeholder:text-slate-400 ${inputClassName}`}
      />
      <button
        onClick={submit}
        className='rounded-md bg-slate-900 text-white text-xs font-medium px-2.5 py-1 hover:bg-slate-700 whitespace-nowrap'
      >
        {submitLabel}
      </button>
      <button
        onClick={onCancel}
        aria-label='Cancel'
        className='rounded-md p-1 text-slate-400 hover:text-slate-600'
      >
        <X className='w-3.5 h-3.5' />
      </button>
    </div>
  );
}
