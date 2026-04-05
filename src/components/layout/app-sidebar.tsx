"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth/session";
import { NosticLogo } from "@/components/brand/nostic-logo";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
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
  username: string;
};

export function AppSidebar({ role, username }: Props) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col border-r border-white/10 bg-[#161B22]/70 shadow-[4px_0_32px_-8px_rgba(0,0,0,0.5)] backdrop-blur-[10px] md:flex">
      <div className="px-5 py-6">
        <NosticLogo size="md" className="max-w-full" />
        <p className="mt-2 text-xs text-zinc-500">Franchise POS</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {nav
          .filter((item) =>
            (item.roles as readonly UserRole[]).includes(role),
          )
          .map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[16px] px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-[#10B981]/18 text-white shadow-[0_0_28px_-6px_rgba(16,185,129,0.55)] ring-1 ring-[#10B981]/35"
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

      <div className="border-t border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
        <p className="mb-3 truncate px-1 text-xs leading-relaxed text-zinc-500">
          Signed in as{" "}
          <span className="font-semibold text-zinc-200">{username}</span>
          <span className="mt-0.5 block capitalize text-zinc-500">{role}</span>
        </p>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="default"
            className="h-10 w-full justify-center gap-2 font-semibold shadow-[0_0_20px_-4px_rgba(16,185,129,0.45)]"
          >
            <LogOut className="size-4" />
            Log out
          </Button>
        </form>
      </div>
    </aside>
  );
}
