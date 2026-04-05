"use client";

import { AlertsBell } from "@/components/layout/alerts-bell";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import type { ProductDTO } from "@/lib/dashboard-data";
import type { SessionUser } from "@/lib/auth/session";

type Props = {
  session: SessionUser;
  lowStockProducts: ProductDTO[];
  children: React.ReactNode;
};

export function AppShell({ session, lowStockProducts, children }: Props) {
  return (
    <div className="flex min-h-screen bg-[#0B0E14]">
      <AppSidebar role={session.role} username={session.sub} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 border-b border-white/10 bg-[#161B22]/60 px-4 shadow-lg shadow-black/20 backdrop-blur-[10px] md:px-6">
          <div className="mr-auto md:hidden">
            <MobileNav role={session.role} />
          </div>
          <AlertsBell lowStockProducts={lowStockProducts} />
        </header>
        <main className="flex-1 overflow-auto bg-[#0B0E14] p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
