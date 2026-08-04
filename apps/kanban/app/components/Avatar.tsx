'use client';
import { UserRound } from 'lucide-react';
import { Member } from '@repo/kanban-domain';

interface AvatarProps {
  member: Member | null;
  size?: 'sm' | 'md';
}

export function Avatar({ member, size = 'sm' }: AvatarProps) {
  const dim = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs';

  if (!member) {
    return (
      <div
        className={`${dim} rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0`}
        title='Unassigned'
        aria-label='Unassigned'
      >
        <UserRound
          className='w-3 h-3'
          strokeWidth={1.75}
        />
      </div>
    );
  }

  return (
    <div
      className={`${dim} rounded-full bg-slate-800 text-white flex items-center justify-center font-medium shrink-0`}
      title={member.name}
      aria-label={member.name}
    >
      {member.initials}
    </div>
  );
}
