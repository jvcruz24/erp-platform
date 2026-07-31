'use client';
import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Column } from '@repo/kanban-domain';
import { COLUMN_NAME_MAX_LENGTH } from '@repo/kanban-domain';
// import { DropdownMenu } from '@repo/ui/components/ui/dropdown-menu';
import { DropdownMenu } from './DropdownMenu';

interface ColumnHeaderProps {
  column: Column;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function ColumnHeader({
  column,
  onRename,
  onDelete,
}: ColumnHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState(column.name);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onRename(trimmed);
    else setDraft(column.name);
    setEditing(false);
  };

  return (
    <div className='flex items-center justify-between px-1 pb-2.5'>
      {editing ? (
        <input
          autoFocus
          value={draft}
          maxLength={COLUMN_NAME_MAX_LENGTH}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(column.name);
              setEditing(false);
            }
          }}
          className='text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded px-1.5 py-0.5 w-32 outline-none'
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className='flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-slate-600'
        >
          {column.name}
          <span className='rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium px-1.5 py-0.5'>
            {column.tickets.length}
          </span>
        </button>
      )}

      <div className='relative'>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label='Column actions'
          className='rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
        >
          <MoreHorizontal className='w-4 h-4' />
        </button>
        {menuOpen && (
          <DropdownMenu
            onClose={() => setMenuOpen(false)}
            className='w-36'
            items={[
              {
                key: 'rename',
                label: 'Rename',
                icon: <Pencil className='w-3.5 h-3.5' />,
                onSelect: () => setEditing(true),
              },
              {
                key: 'delete',
                label: 'Delete column',
                icon: <Trash2 className='w-3.5 h-3.5' />,
                destructive: true,
                onSelect: onDelete,
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
