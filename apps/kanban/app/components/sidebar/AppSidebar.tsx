'use client';

import * as React from 'react';
import { BoardSummary } from '@repo/kanban-domain';
import { useBoardList } from '@/app/hooks/useBoardList';
import { apiBoardRepository } from '@/app/data/apiBoardRepository';

import { NavBoards } from '@/app/components/sidebar/NavBoards';
import { NavUser } from '@/app/components/sidebar/nav-user';
import { TeamSwitcher } from '@/app/components/sidebar/TeamSwitcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@repo/ui/components/ui/sidebar';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  LayoutBottomIcon,
  AudioWave01Icon,
  CommandIcon,
  ComputerTerminalIcon,
  RoboticIcon,
  BookOpen02Icon,
  Settings05Icon,
  CropIcon,
  PieChartIcon,
  MapsIcon,
} from '@hugeicons/core-free-icons';

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Acme Inc',
      logo: (
        <HugeiconsIcon
          icon={LayoutBottomIcon}
          strokeWidth={2}
        />
      ),
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: (
        <HugeiconsIcon
          icon={AudioWave01Icon}
          strokeWidth={2}
        />
      ),
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: (
        <HugeiconsIcon
          icon={CommandIcon}
          strokeWidth={2}
        />
      ),
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Playground',
      url: '#',
      icon: (
        <HugeiconsIcon
          icon={ComputerTerminalIcon}
          strokeWidth={2}
        />
      ),
      isActive: true,
      items: [
        {
          title: 'History',
          url: '#',
        },
        {
          title: 'Starred',
          url: '#',
        },
        {
          title: 'Settings',
          url: '#',
        },
      ],
    },
    {
      title: 'Models',
      url: '#',
      icon: (
        <HugeiconsIcon
          icon={RoboticIcon}
          strokeWidth={2}
        />
      ),
      items: [
        {
          title: 'Genesis',
          url: '#',
        },
        {
          title: 'Explorer',
          url: '#',
        },
        {
          title: 'Quantum',
          url: '#',
        },
      ],
    },
    {
      title: 'Documentation',
      url: '#',
      icon: (
        <HugeiconsIcon
          icon={BookOpen02Icon}
          strokeWidth={2}
        />
      ),
      items: [
        {
          title: 'Introduction',
          url: '#',
        },
        {
          title: 'Get Started',
          url: '#',
        },
        {
          title: 'Tutorials',
          url: '#',
        },
        {
          title: 'Changelog',
          url: '#',
        },
      ],
    },
    {
      title: 'Settings',
      url: '#',
      icon: (
        <HugeiconsIcon
          icon={Settings05Icon}
          strokeWidth={2}
        />
      ),
      items: [
        {
          title: 'General',
          url: '#',
        },
        {
          title: 'Team',
          url: '#',
        },
        {
          title: 'Billing',
          url: '#',
        },
        {
          title: 'Limits',
          url: '#',
        },
      ],
    },
  ],
  boards: [
    {
      name: 'Design Engineering',
      url: '/boards/1',
      icon: (
        <HugeiconsIcon
          icon={CropIcon}
          strokeWidth={2}
        />
      ),
    },
    {
      name: 'Sales & Marketing',
      url: '/boards/2',
      icon: (
        <HugeiconsIcon
          icon={PieChartIcon}
          strokeWidth={2}
        />
      ),
    },
    {
      name: 'Travel',
      url: '/boards/3',
      icon: (
        <HugeiconsIcon
          icon={MapsIcon}
          strokeWidth={2}
        />
      ),
    },
  ],
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar>;

export function AppSidebar({ ...props }: AppSidebarProps) {
  const {
    boards: liveBoards,
    isLoading,
    error,
    createBoard,
    renameBoard,
    deleteBoard,
  } = useBoardList(apiBoardRepository);

  return (
    <Sidebar
      collapsible='icon'
      {...props}
    >
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavBoards
          boards={liveBoards}
          onCreateBoard={createBoard}
          onDeleteBoard={deleteBoard}
          onRenameBoard={renameBoard}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
