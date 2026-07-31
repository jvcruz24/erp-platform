import { Member, Ticket } from '@repo/kanban-domain';
import { TicketCardContent } from './TicketCardContent';

interface DropGhostProps {
  ticket: Ticket;
  member: Member | null;
}

/**
 * Renders the SAME content as the real card (via TicketCardContent) inside
 * a dashed, translucent shell instead of a plain box. Two benefits over a
 * generic placeholder: it reads unambiguously as "this card, arriving
 * here" rather than an abstract slot, and its height naturally matches the
 * real card's height (same title, same layout) with no manual measuring.
 */
export function DropGhost({ ticket, member }: DropGhostProps) {
  return (
    <div
      aria-hidden='true'
      className='rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/70 p-2.5 opacity-80 pointer-events-none transition-all duration-100'
    >
      <TicketCardContent
        ticket={ticket}
        member={member}
      />
    </div>
  );
}
