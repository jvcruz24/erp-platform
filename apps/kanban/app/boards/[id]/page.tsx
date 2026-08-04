import KanbanBoard from '@/app/components/KanbanBoard';

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KanbanBoard boardId={id} />;
}
