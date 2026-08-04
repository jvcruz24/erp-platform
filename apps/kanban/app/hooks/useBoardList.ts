'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BoardListRepository } from '@repo/kanban-domain';

const boardsKey = ['boards'] as const;

export function useBoardList(repository: BoardListRepository) {
  const queryClient = useQueryClient();

  const {
    data: boards = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: boardsKey,
    queryFn: () => repository.listBoards(),
  });

  const createBoard = useMutation({
    mutationFn: (name: string) => repository.createBoard({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsKey });
    },
  });

  const deleteBoard = useMutation({
    mutationFn: (boardId: string) => repository.deleteBoard(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsKey });
    },
  });

  const renameBoard = useMutation({
    mutationFn: ({ boardId, name }: { boardId: string; name: string }) =>
      repository.renameBoard({ boardId, name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsKey });
    },
  });

  return {
    boards,
    isLoading,
    error: error ? "Couldn't load your boards. Please refresh." : null,
    createBoard: (name: string) => createBoard.mutateAsync(name),
    deleteBoard: (boardId: string) => deleteBoard.mutateAsync(boardId),
    renameBoard: ({ boardId, name }: { boardId: string; name: string }) =>
      renameBoard.mutateAsync({ boardId, name }),
  };
}
