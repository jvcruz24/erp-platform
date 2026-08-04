// apps/kanban/app/api/boards/route.ts
import { NextResponse } from 'next/server';
import { createBoardInputSchema, generateId } from '@repo/kanban-domain';
import { boardsStore } from './_store';

export async function GET() {
  return NextResponse.json(boardsStore);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createBoardInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const newBoard = { id: generateId(), name: parsed.data.name };
  boardsStore.push(newBoard);

  return NextResponse.json(newBoard, { status: 201 });
}
