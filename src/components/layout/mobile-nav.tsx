"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NosticLogo } from "@/components/brand/nostic-logo";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth/session";
import {
  BarChart3,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  ShoppingCart,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["manager", "staff"] as const },
  { href: "/pos", label: "POS Terminal", icon: ShoppingCart, roles: ["manager", "staff"] as const },
  { href: "/inventory", label: "Inventory", icon: Package, roles: ["manager"] as const },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["manager"] as const },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["manager"] as const },
];

type Props = {
  role: UserRole;
};

export function MobileNav({ role }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = nav.filter((item) =>
    (item.roles as readonly UserRole[]).includes(role),
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="size-10 shrink-0 border-white/10 bg-[#161B22]/80 text-zinc-100 shadow-md backdrop-blur-md"
          />
        }
      >
        <Menu className="size-[18px]" />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent
        side="left"
        showCloseButton
        className="flex w-[260px] max-w-[260px] flex-col border-white/10 bg-[#161B22]/95 p-0 backdrop-blur-[10px]"
      >
        <SheetHeader className="border-b border-white/10 p-4 text-left">
          <SheetTitle className="sr-only">NOSTIC — navigation menu</SheetTitle>
          <NosticLogo size="sm" />
          <p className="mt-2 text-xs text-zinc-500">Franchise POS</p>
        </SheetHeader>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-[16px] px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-[#10B981]/18 text-white shadow-[0_0_24px_-6px_rgba(16,185,129,0.5)] ring-1 ring-[#10B981]/35"
                    : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200",
                )}
              >
                <Icon
                  className={cn(
                    "size-[18px] shrink-0",
                    active ? "text-emerald-300" : "text-zinc-500",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 bg-white/[0.04] p-3">
          <form action={logoutAction}>
            <Button type="submit" variant="default" className="w-full font-semibold">
              Log out
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
