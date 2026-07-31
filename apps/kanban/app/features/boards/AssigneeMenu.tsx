'use client';
import { Member } from '@repo/kanban-domain';
import { Avatar } from './Avatar';
import { DropdownMenu, DropdownMenuItem } from './DropdownMenu';

interface AssigneeMenuProps {
  members: Member[];
  assigneeId: string | null;
  onChange: (assigneeId: string | null) => void;
  onClose: () => void;
}

export function AssigneeMenu({
  members,
  assigneeId,
  onChange,
  onClose,
}: AssigneeMenuProps) {
  const items: DropdownMenuItem[] = [
    {
      key: 'unassigned',
      label: 'Unassigned',
      icon: <Avatar member={null} />,
      selected: !assigneeId,
      onSelect: () => onChange(null),
    },
    ...members.map((m) => ({
      key: m.id,
      label: m.name,
      icon: <Avatar member={m} />,
      selected: assigneeId === m.id,
      onSelect: () => onChange(m.id),
    })),
  ];

  return (
    <DropdownMenu
      items={items}
      onClose={onClose}
    />
  );
}
