'use client';
import { forwardRef, useState } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Member, Ticket } from '@repo/kanban-domain';
import { Avatar } from './Avatar';
import { AssigneeMenu } from './AssigneeMenu';
import { DropdownMenu } from './DropdownMenu';
import { TicketCardContent } from './TicketCardContent';

interface TicketCardProps {
  ticket: Ticket;
  members: Member[];
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDelete: (ticketId: string) => void;
  onAssign: (ticketId: string, assigneeId: string | null) => void;
}

// forwardRef so the drag-and-drop hook can measure this card's real
// bounding box (needed to compute an accurate insertion index on drag-over).
export const TicketCard = forwardRef<HTMLDivElement, TicketCardProps>(
  function TicketCard(
    { ticket, members, isDragging, onDragStart, onDragEnd, onDelete, onAssign },
    ref,
  ) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const member = members.find((m) => m.id === ticket.assigneeId) ?? null;

    return (
      <div
        ref={ref}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`group relative rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm cursor-grab active:cursor-grabbing transition-opacity ${
          isDragging ? 'opacity-40' : 'opacity-100'
        } hover:border-slate-300`}
      >
        <TicketCardContent
          ticket={ticket}
          member={member}
          titleAction={
            <>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label='Ticket actions'
                className='shrink-0 rounded p-0.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600 transition-opacity'
              >
                <MoreHorizontal className='w-3.5 h-3.5' />
              </button>
              {menuOpen && (
                <DropdownMenu
                  onClose={() => setMenuOpen(false)}
                  className='right-2 w-32'
                  items={[
                    {
                      key: 'delete',
                      label: 'Delete',
                      icon: <Trash2 className='w-3.5 h-3.5' />,
                      destructive: true,
                      onSelect: () => onDelete(ticket.id),
                    },
                  ]}
                />
              )}
            </>
          }
          avatarSlot={
            <div className='relative'>
              <button
                onClick={() => setAssignOpen((v) => !v)}
                aria-label='Change assignee'
              >
                <Avatar member={member} />
              </button>
              {assignOpen && (
                <AssigneeMenu
                  members={members}
                  assigneeId={ticket.assigneeId}
                  onChange={(id) => onAssign(ticket.id, id)}
                  onClose={() => setAssignOpen(false)}
                />
              )}
            </div>
          }
        />
      </div>
    );
  },
);
