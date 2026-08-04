'use client';
import { useState } from 'react';
import Link from 'next/link';
import { BoardSummary } from '@repo/kanban-domain';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@repo/ui/components/ui/sidebar';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  MoreHorizontalCircle01Icon,
  FolderIcon,
  ArrowRightIcon,
  Delete02Icon,
  X,
  PencilEditIcon,
} from '@hugeicons/core-free-icons';

interface NavBoardItemProps {
  board: BoardSummary;
  onRenameBoard: ({ boardId, name }: { boardId: string; name: string }) => void;
  onDeleteBoard: (boardId: string) => void;
}

export default function NavBoardItem({
  board,
  onRenameBoard,
  onDeleteBoard,
}: NavBoardItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <SidebarMenuItem>
        <InlineEditInput
          initialValue={board.name}
          onSubmit={(newName) => {
            onRenameBoard({ boardId: board.id, name: newName });
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link href={`/boards/${board.id}`}>
          <HugeiconsIcon
            icon={FolderIcon}
            strokeWidth={2}
          />
          <span>{board.name}</span>
        </Link>
      </SidebarMenuButton>

      <ItemDropDownMenu
        onStartRename={() => setIsEditing(true)}
        onDelete={() => onDeleteBoard(board.id)}
      />
    </SidebarMenuItem>
  );
}

interface InlineEditInputProps {
  initialValue: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

function InlineEditInput({
  initialValue,
  onSubmit,
  onCancel,
}: InlineEditInputProps) {
  const [value, setValue] = useState(initialValue);

  function handleSave() {
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
    } else {
      onCancel();
    }
  }

  return (
    <div className='flex items-center justify-between border border-dashed rounded-md px-2 w-full'>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') onCancel();
        }}
        className='w-full px-2 py-1 text-sm outline-none bg-transparent'
        placeholder='Board name'
      />
      <HugeiconsIcon
        icon={X}
        strokeWidth={2}
        size={16}
        className='text-sm text-sidebar-foreground/70 cursor-pointer shrink-0'
        onClick={onCancel}
      />
    </div>
  );
}

interface ItemDropDownMenuProps {
  onStartRename: () => void;
  onDelete: () => void;
}

function ItemDropDownMenu({ onStartRename, onDelete }: ItemDropDownMenuProps) {
  const { isMobile } = useSidebar();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction
          showOnHover
          className='aria-expanded:bg-muted'
        >
          <HugeiconsIcon
            icon={MoreHorizontalCircle01Icon}
            strokeWidth={2}
          />
          <span className='sr-only'>More</span>
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-fit'
        side={isMobile ? 'bottom' : 'right'}
        align={isMobile ? 'end' : 'start'}
      >
        <DropdownMenuItem onClick={onStartRename}>
          <HugeiconsIcon
            icon={PencilEditIcon}
            strokeWidth={2}
          />
          <span>Rename Board</span>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <HugeiconsIcon
            icon={FolderIcon}
            strokeWidth={2}
          />
          <span>View Boards</span>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <HugeiconsIcon
            icon={ArrowRightIcon}
            strokeWidth={2}
          />
          <span>Share Boards</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant='destructive'
          onClick={onDelete}
        >
          <HugeiconsIcon
            icon={Delete02Icon}
            strokeWidth={2}
          />
          <span>Delete Boards</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
