// apps/kanban/app/api/boards/[boardId]/route.ts
import { NextResponse } from 'next/server';
import { renameBoardInputSchema } from '@repo/kanban-domain';
import { boardsStore } from '../_store';

export async function PATCH(
  request: Request,
  // { params }: { params: Promise<{ boardId: string; name: string }> },
) {
  const body = await request.json();
  const parsed = renameBoardInputSchema.safeParse({
    boardId: body.boardId,
    name: body.name,
  });

  console.log(parsed);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const board = boardsStore.find((b) => b.id === body.boardId);
  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
  }

  board.name = parsed.data.name;
  return NextResponse.json(board);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const index = boardsStore.findIndex((b) => b.id === boardId);
  if (index === -1) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
  }

  boardsStore.splice(index, 1);
  return new NextResponse(null, { status: 204 });
}
