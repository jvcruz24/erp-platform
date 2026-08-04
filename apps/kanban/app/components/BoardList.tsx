'use client';
import { useMemo, useState } from 'react';
import { LayoutGrid, Plus, Trash2, X } from 'lucide-react';
import { BoardRepository, BOARD_NAME_MAX_LENGTH } from '@repo/kanban-domain';
import { InMemoryBoardRepository } from '../data/inMemoryBoardRepository';
import { useBoardList } from '../hooks/useBoardList';
import { InlineAddForm } from './InlineAddForm';

interface BoardListProps {
  repository?: BoardRepository;
  /** How to navigate to a board once selected — defaults to a plain <a>
   *  href, but Next.js apps will usually pass their router's push here. */
  onOpenBoard?: (boardId: string) => void;
}

export function BoardList({ repository, onOpenBoard }: BoardListProps) {
  const repo = useMemo(
    () => repository ?? new InMemoryBoardRepository(),
    [repository],
  );
  const { boards, isLoading, error, dismissError, createBoard, deleteBoard } =
    useBoardList(repo);

  const [addingBoard, setAddingBoard] = useState(false);

  const confirmDelete = (boardId: string, name: string) => {
    if (
      window.confirm(
        `Delete "${name}" and everything in it? This can't be undone.`,
      )
    ) {
      deleteBoard(boardId);
    }
  };

  if (isLoading) {
    return <div className='p-6 text-sm text-slate-500'>Loading boards…</div>;
  }

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <h1 className='mb-4 text-lg font-semibold text-slate-800'>Your boards</h1>

      {error && (
        <div className='mb-3 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
          <span>{error}</span>
          <button
            onClick={dismissError}
            aria-label='Dismiss error'
            className='text-red-500 hover:text-red-700'
          >
            <X className='w-3.5 h-3.5' />
          </button>
        </div>
      )}

      <ul className='flex flex-col gap-2'>
        {boards.map((board) => (
          <li
            key={board.id}
            className='group flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:border-slate-300'
          >
            <button
              onClick={() =>
                onOpenBoard
                  ? onOpenBoard(board.id)
                  : (window.location.href = `/boards/${board.id}`)
              }
              className='flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-slate-600'
            >
              <LayoutGrid className='w-4 h-4 text-slate-400' />
              {board.name}
            </button>
            <button
              onClick={() => confirmDelete(board.id, board.name)}
              aria-label={`Delete ${board.name}`}
              className='rounded p-1 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-opacity'
            >
              <Trash2 className='w-3.5 h-3.5' />
            </button>
          </li>
        ))}
      </ul>

      <div className='mt-3'>
        {addingBoard ? (
          <div className='rounded-lg border border-slate-300 bg-white p-2.5'>
            <InlineAddForm
              placeholder='Board name'
              submitLabel='Create board'
              maxLength={BOARD_NAME_MAX_LENGTH}
              onSubmit={async (name) => {
                const board = await createBoard(name);
                setAddingBoard(false);
                if (board && onOpenBoard) onOpenBoard(board.id);
              }}
              onCancel={() => setAddingBoard(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => setAddingBoard(true)}
            className='flex w-full items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700'
          >
            <Plus className='w-4 h-4' />
            New board
          </button>
        )}
      </div>
    </div>
  );
}
