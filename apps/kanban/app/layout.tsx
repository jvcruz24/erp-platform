import '@repo/ui/styles/globals.css';

import { QueryProvider } from './query-provider';

import { SidebarInset, SidebarProvider } from '@repo/ui/components/ui/sidebar';
import { AppSidebar } from '@/app/components/sidebar/AppSidebar';
import { SiteHeader } from '@/app/components/sidebar/SiteHeader';
import { TooltipProvider } from '@repo/ui/components/ui/tooltip';

import { Geist } from 'next/font/google';
import { BoardSummary } from '@repo/kanban-domain';

const geist = Geist({
  subsets: ['latin'],
});

async function getBoards(): Promise<BoardSummary[]> {
  const res = await fetch('http://localhost:3000/api/boards', {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch boards');
  return res.json();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const boards = await getBoards();

  return (
    <html lang='en'>
      <body className={`${geist.className} flex flex-row w-dvw h-dvh`}>
        <QueryProvider>
          <SidebarProvider
            style={
              {
                '--sidebar-width': 'calc(var(--spacing) * 72)',
                '--header-height': 'calc(var(--spacing) * 12)',
              } as React.CSSProperties
            }
          >
            <TooltipProvider>
              <AppSidebar boards={boards} />
            </TooltipProvider>
            <SidebarInset className='h-full'>
              <SiteHeader />
              {children}
              <pre>{JSON.stringify(boards, null, 2)}</pre>
            </SidebarInset>
          </SidebarProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
