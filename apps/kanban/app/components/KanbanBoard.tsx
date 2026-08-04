'use client';
import Link from 'next/link';
import { Fragment, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  BoardDetailRepository,
  COLUMN_NAME_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from '@repo/kanban-domain';
import { InMemoryBoardRepository } from '../data/inMemoryBoardRepository';
import { useKanbanBoard } from '../hooks/useKanbanBoard';
import { useTicketDragAndDrop } from '../hooks/useTicketDragAndDrop';
import { ColumnHeader } from './ColumnHeader';
import { TicketCard } from './TicketCard';
import { InlineAddForm } from './InlineAddForm';
import { DropGhost } from './DropGhost';

interface KanbanBoardProps {
  boardId: string;
  repository?: BoardDetailRepository;
}

export default function KanbanBoard({ boardId, repository }: KanbanBoardProps) {
  const repo = useMemo(
    () => repository ?? new InMemoryBoardRepository(),
    [repository],
  );
  const board = useKanbanBoard(repo, boardId);
  const dnd = useTicketDragAndDrop();

  const [addingCardIn, setAddingCardIn] = useState<string | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);

  // The ghost placeholder shows the actual ticket being dragged, so look
  // it up once here rather than passing IDs down for every column to
  // re-resolve.
  const draggingTicket = useMemo(() => {
    if (!dnd.draggingTicketId) return null;
    for (const c of board.columns) {
      const found = c.tickets.find((t) => t.id === dnd.draggingTicketId);
      if (found) return found;
    }
    return null;
  }, [board.columns, dnd.draggingTicketId]);

  const draggingMember = draggingTicket
    ? (board.members.find((m) => m.id === draggingTicket.assigneeId) ?? null)
    : null;

  const confirmDeleteColumn = (
    columnId: string,
    columnName: string,
    ticketCount: number,
  ) => {
    const message =
      ticketCount > 0
        ? `Delete "${columnName}" and its ${ticketCount} ticket${ticketCount === 1 ? '' : 's'}?`
        : `Delete "${columnName}"?`;
    if (window.confirm(message)) {
      board.deleteColumn(columnId);
    }
  };

  if (board.isLoading) {
    return (
      <div className='w-full h-full bg-slate-50 p-4 text-sm text-slate-500'>
        Loading board…
      </div>
    );
  }

  return (
    <div className='w-full h-full bg-slate-50 p-4'>
      <div className='mb-3 flex items-center justify-between'>
        <h1 className='text-base font-semibold text-slate-800'>
          {board.boardName}
        </h1>
        <Link
          href='/boards'
          className='text-xs text-slate-500 hover:text-slate-700 hover:underline'
        >
          All boards
        </Link>
      </div>

      {board.error && (
        <div className='mb-3 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
          <span>{board.error}</span>
          <button
            onClick={board.dismissError}
            aria-label='Dismiss error'
            className='text-red-500 hover:text-red-700'
          >
            <X className='w-3.5 h-3.5' />
          </button>
        </div>
      )}

      <div className='flex gap-3 overflow-x-auto pb-2 items-start'>
        {board.columns.map((col) => {
          const isDropTargetHere = dnd.dropTarget?.columnId === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) =>
                dnd.handleColumnDragOver(col.id, e, col.tickets)
              }
              onDragLeave={dnd.handleColumnDragLeave}
              onDrop={(e) =>
                dnd.handleColumnDrop(e, (target) => {
                  if (!dnd.draggingTicketId) return;
                  board.moveTicket(
                    dnd.draggingTicketId,
                    target.columnId,
                    target.index,
                  );
                })
              }
              className={`w-64 shrink-0 rounded-xl p-2 pt-2.5 transition-colors ${
                isDropTargetHere ? 'bg-slate-100' : 'bg-slate-100/60'
              }`}
            >
              <ColumnHeader
                column={col}
                onRename={(name) => board.renameColumn(col.id, name)}
                onDelete={() =>
                  confirmDeleteColumn(col.id, col.name, col.tickets.length)
                }
              />

              <div className='flex flex-col gap-2 min-h-2'>
                {(() => {
                  // Walk the FULL list (dragged card included, just faded)
                  // rather than removing it — removing it mid-drag would
                  // unmount the exact DOM node the browser is using to
                  // render the native drag ghost, which is what broke it.
                  // `otherIndex` tracks position among the non-dragged
                  // cards only, since that's what `dropTarget.index`
                  // (and `moveTicket`) are expressed in terms of.
                  let otherIndex = 0;
                  return col.tickets.map((t) => {
                    const isDragged = t.id === dnd.draggingTicketId;
                    const showIndicatorBefore =
                      isDropTargetHere &&
                      !isDragged &&
                      dnd.dropTarget?.index === otherIndex;
                    if (!isDragged) otherIndex += 1;

                    return (
                      <Fragment key={t.id}>
                        {showIndicatorBefore && draggingTicket && (
                          <DropGhost
                            ticket={draggingTicket}
                            member={draggingMember}
                          />
                        )}
                        <TicketCard
                          ref={dnd.registerTicketRef(t.id)}
                          ticket={t}
                          members={board.members}
                          isDragging={isDragged}
                          onDragStart={() => dnd.handleCardDragStart(t.id)}
                          onDragEnd={dnd.handleCardDragEnd}
                          onDelete={(id) => board.deleteTicket(col.id, id)}
                          onAssign={(id, assigneeId) =>
                            board.assignTicket(col.id, id, assigneeId)
                          }
                        />
                      </Fragment>
                    );
                  });
                })()}
                {isDropTargetHere &&
                  draggingTicket &&
                  dnd.dropTarget?.index ===
                    col.tickets.filter((t) => t.id !== dnd.draggingTicketId)
                      .length && (
                    <DropGhost
                      ticket={draggingTicket}
                      member={draggingMember}
                    />
                  )}
              </div>

              {addingCardIn === col.id ? (
                <div className='mt-2 rounded-lg border border-slate-300 bg-white p-2'>
                  <InlineAddForm
                    placeholder='Ticket title'
                    submitLabel='Add'
                    maxLength={TITLE_MAX_LENGTH}
                    inputClassName='text-[13px]'
                    onSubmit={(title) => {
                      board.addTicket(col.id, title);
                      setAddingCardIn(null);
                    }}
                    onCancel={() => setAddingCardIn(null)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setAddingCardIn(col.id)}
                  className='mt-2 w-full flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] text-slate-500 hover:bg-slate-200/60 hover:text-slate-700'
                >
                  <Plus className='w-3.5 h-3.5' />
                  Add ticket
                </button>
              )}
            </div>
          );
        })}

        <div className='w-64 shrink-0'>
          {addingColumn ? (
            <div className='rounded-xl border border-slate-300 bg-white p-2.5'>
              <InlineAddForm
                placeholder='Column name'
                submitLabel='Add column'
                maxLength={COLUMN_NAME_MAX_LENGTH}
                onSubmit={(name) => {
                  board.addColumn(name);
                  setAddingColumn(false);
                }}
                onCancel={() => setAddingColumn(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingColumn(true)}
              className='w-full flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700'
            >
              <Plus className='w-4 h-4' />
              Add column
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
