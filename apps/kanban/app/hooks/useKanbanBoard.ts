import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BoardRepository, Column, Member } from '@repo/kanban-domain';

interface UseKanbanBoardResult {
  boardName: string | null;
  columns: Column[];
  members: Member[];
  isLoading: boolean;
  error: string | null;
  dismissError: () => void;
  addTicket: (columnId: string, title: string) => Promise<void>;
  deleteTicket: (columnId: string, ticketId: string) => Promise<void>;
  assignTicket: (
    columnId: string,
    ticketId: string,
    assigneeId: string | null,
  ) => Promise<void>;
  moveTicket: (
    ticketId: string,
    toColumnId: string,
    toIndex: number,
  ) => Promise<void>;
  addColumn: (name: string) => Promise<void>;
  renameColumn: (columnId: string, name: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
}

/**
 * Scoped to a single board (`boardId`). The hook still exposes simple
 * positional-arg functions to components — `assignTicket(columnId,
 * ticketId, assigneeId)` — and builds the `{ boardId, ... }` input object
 * the repository expects internally. Switching boards is just passing a
 * different `boardId`; the effect below re-loads whenever it changes.
 */
export function useKanbanBoard(
  repository: BoardRepository,
  boardId: string,
): UseKanbanBoardResult {
  const [boardName, setBoardName] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const snapshotRef = useRef<Column[]>([]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const [board, loadedMembers] = await Promise.all([
          repository.loadBoard(boardId),
          repository.listMembers(),
        ]);
        if (cancelled) return;
        setBoardName(board.name);
        setColumns(board.columns);
        setMembers(loadedMembers);
      } catch {
        if (!cancelled) setError("Couldn't load the board. Please refresh.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repository, boardId]);

  const withOptimisticUpdate = useCallback(
    async (
      apply: (prev: Column[]) => Column[],
      commit: () => Promise<void>,
      failureMessage: string,
    ) => {
      snapshotRef.current = columns;
      setColumns(apply);
      try {
        await commit();
      } catch (err) {
        setColumns(snapshotRef.current);
        setError(err instanceof Error ? err.message : failureMessage);
      }
    },
    [columns],
  );

  const addTicket = useCallback(
    async (columnId: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      try {
        const ticket = await repository.createTicket({
          boardId,
          columnId,
          title: trimmed,
        });
        setColumns((prev) =>
          prev.map((c) =>
            c.id === columnId ? { ...c, tickets: [...c.tickets, ticket] } : c,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't add ticket.");
      }
    },
    [repository, boardId],
  );

  const deleteTicket = useCallback(
    (columnId: string, ticketId: string) =>
      withOptimisticUpdate(
        (prev) =>
          prev.map((c) =>
            c.id === columnId
              ? { ...c, tickets: c.tickets.filter((t) => t.id !== ticketId) }
              : c,
          ),
        () => repository.deleteTicket(boardId, columnId, ticketId),
        "Couldn't delete ticket.",
      ),
    [repository, boardId, withOptimisticUpdate],
  );

  const assignTicket = useCallback(
    (columnId: string, ticketId: string, assigneeId: string | null) =>
      withOptimisticUpdate(
        (prev) =>
          prev.map((c) =>
            c.id === columnId
              ? {
                  ...c,
                  tickets: c.tickets.map((t) =>
                    t.id === ticketId ? { ...t, assigneeId } : t,
                  ),
                }
              : c,
          ),
        () =>
          repository.assignTicket({ boardId, columnId, ticketId, assigneeId }),
        "Couldn't reassign ticket.",
      ),
    [repository, boardId, withOptimisticUpdate],
  );

  const moveTicket = useCallback(
    (ticketId: string, toColumnId: string, toIndex: number) =>
      withOptimisticUpdate(
        (prev) => {
          const next = prev.map((c) => ({ ...c, tickets: [...c.tickets] }));
          let moved;
          for (const col of next) {
            const idx = col.tickets.findIndex((t) => t.id === ticketId);
            if (idx !== -1) {
              [moved] = col.tickets.splice(idx, 1);
              break;
            }
          }
          if (!moved) return prev;
          const target = next.find((c) => c.id === toColumnId);
          if (!target) return prev;
          const clampedIndex = Math.max(
            0,
            Math.min(toIndex, target.tickets.length),
          );
          target.tickets.splice(clampedIndex, 0, moved);
          return next;
        },
        () => repository.moveTicket({ boardId, ticketId, toColumnId, toIndex }),
        "Couldn't move ticket.",
      ),
    [repository, boardId, withOptimisticUpdate],
  );

  const addColumn = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      try {
        const column = await repository.createColumn({
          boardId,
          name: trimmed,
        });
        setColumns((prev) => [...prev, column]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't add column.");
      }
    },
    [repository, boardId],
  );

  const renameColumn = useCallback(
    (columnId: string, name: string) =>
      withOptimisticUpdate(
        (prev) => prev.map((c) => (c.id === columnId ? { ...c, name } : c)),
        () => repository.renameColumn({ boardId, columnId, name }),
        "Couldn't rename column.",
      ),
    [repository, boardId, withOptimisticUpdate],
  );

  const deleteColumn = useCallback(
    (columnId: string) =>
      withOptimisticUpdate(
        (prev) => prev.filter((c) => c.id !== columnId),
        () => repository.deleteColumn(boardId, columnId),
        "Couldn't delete column.",
      ),
    [repository, boardId, withOptimisticUpdate],
  );

  const dismissError = useCallback(() => setError(null), []);

  return useMemo(
    () => ({
      boardName,
      columns,
      members,
      isLoading,
      error,
      dismissError,
      addTicket,
      deleteTicket,
      assignTicket,
      moveTicket,
      addColumn,
      renameColumn,
      deleteColumn,
    }),
    [
      boardName,
      columns,
      members,
      isLoading,
      error,
      dismissError,
      addTicket,
      deleteTicket,
      assignTicket,
      moveTicket,
      addColumn,
      renameColumn,
      deleteColumn,
    ],
  );
}
