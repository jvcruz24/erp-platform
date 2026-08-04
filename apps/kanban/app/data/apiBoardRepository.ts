import type { BoardListRepository, BoardSummary } from '@repo/kanban-domain';

export const apiBoardRepository: BoardListRepository = {
  async listBoards(): Promise<BoardSummary[]> {
    const res = await fetch('/api/boards');
    if (!res.ok) throw new Error('Failed to fetch boards');
    return res.json();
  },

  async createBoard(input: { name: string }): Promise<BoardSummary> {
    const res = await fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('Failed to create board');
    return res.json();
  },

  async renameBoard(input: { boardId: string; name: string }): Promise<void> {
    const res = await fetch(`/api/boards/${input.boardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId: input.boardId, name: input.name }),
    });
    console.log('Res', res);
    if (!res.ok) throw new Error('Failed to rename board');
  },

  async deleteBoard(boardId: string): Promise<void> {
    const res = await fetch(`/api/boards/${boardId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete board');
  },
};
