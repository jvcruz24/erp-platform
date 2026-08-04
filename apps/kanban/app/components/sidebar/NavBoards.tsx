'use client';
import { useState } from 'react';
import { BoardSummary } from '@repo/kanban-domain';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@repo/ui/components/ui/sidebar';

import NavBoardItem from './NavBoardItem';

import { HugeiconsIcon } from '@hugeicons/react';
import { Plus, X } from '@hugeicons/core-free-icons';

export function NavBoards({
  boards,
  onCreateBoard,
  onDeleteBoard,
  onRenameBoard,
}: {
  boards: BoardSummary[];
  onCreateBoard: (name: string) => void;
  onRenameBoard: ({ boardId, name }: { boardId: string; name: string }) => void;
  onDeleteBoard: (boardId: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [isReNaming, setIsReNaming] = useState(false);
  const [newName, setNewName] = useState('');

  function submitNewBoard() {
    const trimmed = newName.trim();
    if (trimmed) onCreateBoard(trimmed);
    setNewName('');
    setIsAdding(false);
  }

  return (
    <SidebarGroup className=''>
      <SidebarGroupLabel>Boards</SidebarGroupLabel>
      <SidebarMenuItem>
        {isAdding ? (
          <div className='flex items-center justify-between border border-dashed rounded-md px-2'>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={submitNewBoard}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewBoard();
                if (e.key === 'Escape') {
                  setNewName('');
                  setIsAdding(false);
                }
              }}
              className='w-full px-2 py-1 text-sm outline-none'
              placeholder='Board name'
            />
            <HugeiconsIcon
              icon={X}
              strokeWidth={2}
              size={16}
              className='text-sm text-sidebar-foreground/70 cursor-pointer'
            />
          </div>
        ) : (
          <SidebarMenuButton
            className='text-sidebar-foreground/70 border border-dashed'
            onClick={() => setIsAdding(true)}
          >
            <HugeiconsIcon
              icon={Plus}
              strokeWidth={2}
              className='text-sidebar-foreground/70'
            />
            <span>New Board</span>
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
      <SidebarMenu>
        {boards.map((board) => (
          <NavBoardItem
            key={board.id}
            board={board}
            onRenameBoard={onRenameBoard}
            onDeleteBoard={onDeleteBoard}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
