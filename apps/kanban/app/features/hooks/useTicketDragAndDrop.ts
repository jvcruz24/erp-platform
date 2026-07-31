import { useCallback, useRef, useState } from 'react';

export interface DropTarget {
  columnId: string;
  index: number;
}

interface MinimalTicket {
  id: string;
}

interface UseTicketDragAndDropResult {
  draggingTicketId: string | null;
  dropTarget: DropTarget | null;
  /** Pass to each TicketCard's ref so we can measure its position on drag-over. */
  registerTicketRef: (ticketId: string) => (el: HTMLElement | null) => void;
  handleCardDragStart: (ticketId: string) => void;
  handleCardDragEnd: () => void;
  handleColumnDragOver: (
    columnId: string,
    event: React.DragEvent,
    tickets: MinimalTicket[],
  ) => void;
  handleColumnDragLeave: (event: React.DragEvent) => void;
  handleColumnDrop: (
    event: React.DragEvent,
    onDrop: (target: DropTarget) => void,
  ) => void;
}

/**
 * Single Responsibility: this hook only answers "what's being dragged and
 * where would it land" — it knows nothing about tickets/columns as domain
 * concepts beyond an `id`, and nothing about rendering. KanbanBoard wires
 * its output to actual JSX; useKanbanBoard's `moveTicket` is what actually
 * commits the move once the user releases.
 */
export function useTicketDragAndDrop(): UseTicketDragAndDropResult {
  const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  // Real DOM nodes, keyed by ticket id, so drag-over can read actual
  // bounding boxes instead of guessing from array order.
  const ticketElements = useRef<Map<string, HTMLElement>>(new Map());
  // Stable callback-ref identities per ticket id, so React doesn't
  // unregister/re-register a ref on every render.
  const refCallbacks = useRef<Map<string, (el: HTMLElement | null) => void>>(
    new Map(),
  );

  const registerTicketRef = useCallback((ticketId: string) => {
    let callback = refCallbacks.current.get(ticketId);
    if (!callback) {
      callback = (el) => {
        if (el) ticketElements.current.set(ticketId, el);
        else ticketElements.current.delete(ticketId);
      };
      refCallbacks.current.set(ticketId, callback);
    }
    return callback;
  }, []);

  const handleCardDragStart = useCallback((ticketId: string) => {
    setDraggingTicketId(ticketId);
  }, []);

  const handleCardDragEnd = useCallback(() => {
    setDraggingTicketId(null);
    setDropTarget(null);
  }, []);

  const handleColumnDragOver = useCallback(
    (columnId: string, event: React.DragEvent, tickets: MinimalTicket[]) => {
      event.preventDefault();
      if (!draggingTicketId) return;

      // Exclude the card being dragged from the measurement list. Its
      // "index" among the remaining cards is exactly what `moveTicket`
      // expects, since the mutation splices the dragged card out of its
      // source column before inserting it at this index.
      const others = tickets.filter((t) => t.id !== draggingTicketId);
      const cursorY = event.clientY;

      let index = others.length;
      for (let i = 0; i < others.length; i++) {
        const el = ticketElements.current.get(others[i].id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        if (cursorY < midpoint) {
          index = i;
          break;
        }
      }

      setDropTarget((prev) =>
        prev && prev.columnId === columnId && prev.index === index
          ? prev
          : { columnId, index },
      );
    },
    [draggingTicketId],
  );

  const handleColumnDragLeave = useCallback((event: React.DragEvent) => {
    // dragleave fires when moving over any child, not just when actually
    // leaving the column — only clear when the pointer truly left the
    // column's bounding element.
    const container = event.currentTarget as HTMLElement;
    const next = event.relatedTarget as Node | null;
    if (!next || !container.contains(next)) {
      setDropTarget(null);
    }
  }, []);

  const handleColumnDrop = useCallback(
    (event: React.DragEvent, onDrop: (target: DropTarget) => void) => {
      event.preventDefault();
      if (dropTarget) onDrop(dropTarget);
      handleCardDragEnd();
    },
    [dropTarget, handleCardDragEnd],
  );

  return {
    draggingTicketId,
    dropTarget,
    registerTicketRef,
    handleCardDragStart,
    handleCardDragEnd,
    handleColumnDragOver,
    handleColumnDragLeave,
    handleColumnDrop,
  };
}
