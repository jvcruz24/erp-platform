import { Member, PRIORITY_META, Ticket } from '@repo/kanban-domain';
import { Avatar } from './Avatar';

interface TicketCardContentProps {
  ticket: Ticket;
  member: Member | null;
  /** Rendered next to the title. TicketCard puts its actions-menu button
   *  here; the ghost placeholder omits it — nothing to act on mid-drag. */
  titleAction?: React.ReactNode;
  /** Wraps the avatar. TicketCard makes it clickable (assignee picker);
   *  the ghost renders a plain, non-interactive Avatar instead. */
  avatarSlot?: React.ReactNode;
}

/**
 * Pure presentation, no state, no event handlers of its own — just "what
 * does a ticket look like." TicketCard adds interactivity around it via
 * the two slots; DropGhost renders it completely inert. One layout,
 * two contexts, impossible for them to drift apart (DRY).
 */
export function TicketCardContent({
  ticket,
  member,
  titleAction,
  avatarSlot,
}: TicketCardContentProps) {
  const priority = PRIORITY_META[ticket.priority];

  return (
    <>
      <div className='flex items-start justify-between gap-2'>
        <p className='text-[13px] leading-snug text-slate-800 font-medium break-words'>
          {ticket.title}
        </p>
        {titleAction}
      </div>

      <div className='mt-2.5 flex items-center justify-between'>
        <span className='inline-flex items-center gap-1.5 text-[11px] text-slate-500'>
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </span>
        {avatarSlot ?? <Avatar member={member} />}
      </div>
    </>
  );
}
