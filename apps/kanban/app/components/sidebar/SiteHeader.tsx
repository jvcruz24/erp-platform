'use client';
import { Separator } from '@repo/ui/components/ui/separator';
import { SidebarTrigger } from '@repo/ui/components/ui/sidebar';
import {
  AvatarGroup,
  Avatar,
  AvatarGroupCount,
  AvatarFallback,
  AvatarImage,
} from '../../../../../packages/ui/src/components/ui/avatar';

export function SiteHeader() {
  return (
    <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mx-2 data-[orientation=vertical]:h-4'
        />
        <h1 className='text-base font-medium'>Board Name</h1>
      </div>
      <AvatarGroup className='grayscale'>
        <Avatar>
          <AvatarImage
            src='https://github.com/shadcn.png'
            alt='@shadcn'
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage
            src='https://github.com/maxleiter.png'
            alt='@maxleiter'
          />
          <AvatarFallback>LR</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage
            src='https://github.com/evilrabbit.png'
            alt='@evilrabbit'
          />
          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>
    </header>
  );
}
