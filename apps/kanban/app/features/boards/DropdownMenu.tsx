'use client';
import { useOutsideClick } from '../hooks/useOutsideClick';

export interface DropdownMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  selected?: boolean;
  onSelect: () => void;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  onClose: () => void;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * One generic, keyboard-accessible menu implementation. The original file
 * hand-rolled three separate absolutely-positioned menus (ticket actions,
 * column actions, assignee picker) with copy-pasted markup and no shared
 * outside-click handling. This is the single source of truth for "what a
 * dropdown menu looks like and how it behaves" (DRY + Single Responsibility).
 */
export function DropdownMenu({
  items,
  onClose,
  align = 'right',
  className = '',
}: DropdownMenuProps) {
  const ref = useOutsideClick<HTMLDivElement>(onClose, true);

  return (
    <div
      ref={ref}
      role='menu'
      className={`absolute top-7 z-20 w-44 rounded-md border border-slate-200 bg-white shadow-md py-1 ${
        align === 'right' ? 'right-0' : 'left-0'
      } ${className}`}
    >
      {items.map((item) => (
        <button
          key={item.key}
          role='menuitem'
          onClick={() => {
            item.onSelect();
            onClose();
          }}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-sm hover:bg-slate-50 ${
            item.destructive
              ? 'text-red-600 hover:bg-red-50'
              : item.selected
                ? 'text-slate-900 font-medium'
                : 'text-slate-600'
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
