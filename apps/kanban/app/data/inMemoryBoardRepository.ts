import {
  Board,
  BoardDetailRepository,
  BoardSummary,
  Column,
  Member,
  Ticket,
  CreateBoardInput,
  RenameBoardInput,
  CreateTicketInput,
  AssignTicketInput,
  MoveTicketInput,
  CreateColumnInput,
  RenameColumnInput,
  createBoardInputSchema,
  renameBoardInputSchema,
  createTicketInputSchema,
  assignTicketInputSchema,
  moveTicketInputSchema,
  createColumnInputSchema,
  renameColumnInputSchema,
  generateId,
} from '@repo/kanban-domain';
import { parseOrThrow } from '@repo/kanban-domain';

const MEMBERS: Member[] = [
  { id: 'u1', name: 'Alex Rivera', initials: 'AR' },
  { id: 'u2', name: 'Priya Nair', initials: 'PN' },
  { id: 'u3', name: 'Sam Cho', initials: 'SC' },
];

const seedBoards = (): Map<string, Board> => {
  const boards = new Map<string, Board>();
  boards.set('b1', {
    id: 'b1',
    name: 'Kanban Platform',
    columns: [
      {
        id: 'c1',
        name: 'Backlog',
        tickets: [
          {
            id: 't1',
            title: 'Set up RLS policies on ticket table',
            priority: 'MEDIUM',
            assigneeId: null,
          },
          {
            id: 't2',
            title: 'Wire dnd-kit into board view',
            priority: 'LOW',
            assigneeId: 'u2',
          },
        ],
      },
      {
        id: 'c2',
        name: 'In Progress',
        tickets: [
          {
            id: 't3',
            title: 'Fix shadcn exports map ordering',
            priority: 'HIGH',
            assigneeId: 'u1',
          },
        ],
      },
      {
        id: 'c3',
        name: 'Done',
        tickets: [
          {
            id: 't4',
            title: 'Flatten apps/web/kanban to apps/kanban',
            priority: 'URGENT',
            assigneeId: 'u3',
          },
        ],
      },
    ],
  });
  boards.set('b2', {
    id: 'b2',
    name: 'Marketing Launch',
    columns: [
      { id: 'c4', name: 'Ideas', tickets: [] },
      { id: 'c5', name: 'In Review', tickets: [] },
    ],
  });
  return boards;
};

/**
 * Every mutation re-validates with the exact same schema apps/api would use
 * for its request body — see @repo/kanban-domain/schemas.ts. Board-scoped
 * lookups (`requireColumn` takes a resolved `Board`, never searches across
 * all boards) are what guarantee a columnId from one board can't
 * accidentally mutate another board's data.
 */
export class InMemoryBoardRepository implements BoardDetailRepository {
  private boards: Map<string, Board> = seedBoards();

  async listBoards(): Promise<BoardSummary[]> {
    return Array.from(this.boards.values()).map(({ id, name }) => ({
      id,
      name,
    }));
  }

  async createBoard(input: CreateBoardInput): Promise<BoardSummary> {
    const { name } = parseOrThrow(createBoardInputSchema, input);
    const board: Board = { id: generateId('b'), name, columns: [] };
    this.boards.set(board.id, board);
    return { id: board.id, name: board.name };
  }

  async renameBoard(input: RenameBoardInput): Promise<void> {
    const { boardId, name } = parseOrThrow(renameBoardInputSchema, input);
    this.requireBoard(boardId).name = name;
  }

  async deleteBoard(boardId: string): Promise<void> {
    this.boards.delete(boardId);
  }

  async loadBoard(boardId: string): Promise<Board> {
    return structuredClone(this.requireBoard(boardId));
  }

  async listMembers(): Promise<Member[]> {
    return structuredClone(MEMBERS);
  }

  async createTicket(input: CreateTicketInput): Promise<Ticket> {
    const { boardId, columnId, title } = parseOrThrow(
      createTicketInputSchema,
      input,
    );
    const column = this.requireColumn(this.requireBoard(boardId), columnId);
    const ticket: Ticket = {
      id: generateId(),
      title,
      priority: 'MEDIUM',
      assigneeId: null,
    };
    column.tickets.push(ticket);
    return ticket;
  }

  async deleteTicket(
    boardId: string,
    columnId: string,
    ticketId: string,
  ): Promise<void> {
    const column = this.requireColumn(this.requireBoard(boardId), columnId);
    column.tickets = column.tickets.filter((t) => t.id !== ticketId);
  }

  async assignTicket(input: AssignTicketInput): Promise<void> {
    const { boardId, columnId, ticketId, assigneeId } = parseOrThrow(
      assignTicketInputSchema,
      input,
    );
    if (assigneeId !== null && !MEMBERS.some((m) => m.id === assigneeId)) {
      throw new Error('Unknown assignee');
    }
    const column = this.requireColumn(this.requireBoard(boardId), columnId);
    const ticket = column.tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error('Ticket not found');
    ticket.assigneeId = assigneeId;
  }

  async moveTicket(input: MoveTicketInput): Promise<void> {
    const { boardId, ticketId, toColumnId, toIndex } = parseOrThrow(
      moveTicketInputSchema,
      input,
    );
    const board = this.requireBoard(boardId);

    let moved: Ticket | undefined;
    for (const col of board.columns) {
      const idx = col.tickets.findIndex((t) => t.id === ticketId);
      if (idx !== -1) {
        [moved] = col.tickets.splice(idx, 1);
        break;
      }
    }
    if (!moved) throw new Error('Ticket not found');

    const target = this.requireColumn(board, toColumnId);
    const clampedIndex = Math.max(0, Math.min(toIndex, target.tickets.length));
    target.tickets.splice(clampedIndex, 0, moved);
  }

  async createColumn(input: CreateColumnInput): Promise<Column> {
    const { boardId, name } = parseOrThrow(createColumnInputSchema, input);
    const board = this.requireBoard(boardId);
    const column: Column = { id: generateId('c'), name, tickets: [] };
    board.columns.push(column);
    return column;
  }

  async renameColumn(input: RenameColumnInput): Promise<void> {
    const { boardId, columnId, name } = parseOrThrow(
      renameColumnInputSchema,
      input,
    );
    this.requireColumn(this.requireBoard(boardId), columnId).name = name;
  }

  async deleteColumn(boardId: string, columnId: string): Promise<void> {
    const board = this.requireBoard(boardId);
    board.columns = board.columns.filter((c) => c.id !== columnId);
  }

  private requireBoard(boardId: string): Board {
    const board = this.boards.get(boardId);
    if (!board) throw new Error('Board not found');
    return board;
  }

  // Takes an already-resolved Board rather than a boardId, so a columnId
  // can only ever be looked up within the board the caller already proved
  // it has — this is the actual boundary that keeps boards isolated.
  private requireColumn(board: Board, columnId: string): Column {
    const column = board.columns.find((c) => c.id === columnId);
    if (!column) throw new Error('Column not found');
    return column;
  }
}
