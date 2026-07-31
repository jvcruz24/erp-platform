import '@repo/ui/styles/globals.css';
import { SidebarInset, SidebarProvider } from '@repo/ui/components/ui/sidebar';
import { AppSidebar } from '@repo/ui/components/app-sidebar';
import { SiteHeader } from '@repo/ui/components/site-header';
import { TooltipProvider } from '@repo/ui/components/ui/tooltip';

import { Geist } from 'next/font/google';

const geist = Geist({
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${geist.className} flex flex-row w-dvw h-dvh`}>
        <SidebarProvider
          style={
            {
              '--sidebar-width': 'calc(var(--spacing) * 72)',
              '--header-height': 'calc(var(--spacing) * 12)',
            } as React.CSSProperties
          }
        >
          <TooltipProvider>
            <AppSidebar />
          </TooltipProvider>
          <SidebarInset className='h-full'>
            <SiteHeader />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
