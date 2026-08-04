import { z } from 'zod';
import {
  memberSchema,
  ticketSchema,
  columnSchema,
  boardSummarySchema,
  boardSchema,
  createBoardInputSchema,
  renameBoardInputSchema,
  createTicketInputSchema,
  assignTicketInputSchema,
  moveTicketInputSchema,
  createColumnInputSchema,
  renameColumnInputSchema,
} from './schemas';

export type Member = z.infer<typeof memberSchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type Column = z.infer<typeof columnSchema>;
export type Priority = Ticket['priority'];

// BoardSummary (id + name) is what a board-list view needs. Board extends
// it with the full column/ticket tree — what a single board's page needs
// once you've navigated into it.
export type BoardSummary = z.infer<typeof boardSummarySchema>;
export type Board = z.infer<typeof boardSchema>;

export type CreateBoardInput = z.infer<typeof createBoardInputSchema>;
export type RenameBoardInput = z.infer<typeof renameBoardInputSchema>;
export type CreateTicketInput = z.infer<typeof createTicketInputSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketInputSchema>;
export type MoveTicketInput = z.infer<typeof moveTicketInputSchema>;
export type CreateColumnInput = z.infer<typeof createColumnInputSchema>;
export type RenameColumnInput = z.infer<typeof renameColumnInputSchema>;

export const PRIORITY_META: Record<Priority, { label: string; dot: string }> = {
  LOW: { label: 'Low', dot: 'bg-slate-400' },
  MEDIUM: { label: 'Medium', dot: 'bg-blue-500' },
  HIGH: { label: 'High', dot: 'bg-orange-500' },
  URGENT: { label: 'Urgent', dot: 'bg-red-500' },
};

export interface BoardListRepository {
  listBoards(): Promise<BoardSummary[]>;
  createBoard(input: CreateBoardInput): Promise<BoardSummary>;
  renameBoard(input: RenameBoardInput): Promise<void>;
  deleteBoard(boardId: string): Promise<void>;
}

export interface BoardDetailRepository {
  loadBoard(boardId: string): Promise<Board>;
  listMembers(): Promise<Member[]>;
  createTicket(input: CreateTicketInput): Promise<Ticket>;
  deleteTicket(input: {
    boardId: string;
    columnId: string;
    ticketId: string;
  }): Promise<void>;
  assignTicket(input: AssignTicketInput): Promise<void>;
  moveTicket(input: MoveTicketInput): Promise<void>;
  createColumn(input: CreateColumnInput): Promise<Column>;
  renameColumn(input: RenameColumnInput): Promise<void>;
  deleteColumn(input: { boardId: string; columnId: string }): Promise<void>;
}
