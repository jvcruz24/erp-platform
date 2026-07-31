'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@repo/ui/components/ui/sidebar';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  MoreHorizontalCircle01Icon,
  FolderIcon,
  ArrowRightIcon,
  Delete02Icon,
  Plus,
} from '@hugeicons/core-free-icons';

export function NavBoards({
  boards,
}: {
  boards: {
    name: string;
    url: string;
    icon: React.ReactNode;
  }[];
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup className=''>
      <SidebarGroupLabel>Boards</SidebarGroupLabel>
      <SidebarMenuItem>
        <SidebarMenuButton className='text-sidebar-foreground/70 border border-dashed'>
          <HugeiconsIcon
            icon={Plus}
            strokeWidth={2}
            className='text-sidebar-foreground/70'
          />
          <span>New Board</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenu>
        {boards.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                {item.icon}
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className='aria-expanded:bg-muted'
                >
                  <HugeiconsIcon
                    icon={MoreHorizontalCircle01Icon}
                    strokeWidth={2}
                  />
                  <span className='sr-only'>More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-fit'
                side={isMobile ? 'bottom' : 'right'}
                align={isMobile ? 'end' : 'start'}
              >
                <DropdownMenuItem>
                  <HugeiconsIcon
                    icon={FolderIcon}
                    strokeWidth={2}
                  />
                  <span>View Boards</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HugeiconsIcon
                    icon={ArrowRightIcon}
                    strokeWidth={2}
                  />
                  <span>Share Boards</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant='destructive'>
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    strokeWidth={2}
                  />
                  <span>Delete Boards</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
