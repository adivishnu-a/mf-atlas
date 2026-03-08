"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, LineChart, Star, Settings2 } from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();

  const routes = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Screener", href: "/funds", icon: LineChart },
    { name: "Watchlist", href: "/watchlist", icon: Star },
    { name: "Backtest", href: "/backtest", icon: Settings2 },
  ];

  return (
    <aside className="w-[250px] shrink-0 border-r border-border bg-surface flex flex-col h-full h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground uppercase">
          MF Atlas
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {routes.map((route) => {
          const isActive = pathname.startsWith(route.href);
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm border transition-colors",
                isActive
                  ? "bg-accent text-foreground border-border"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/50",
              )}
            >
              <route.icon className="w-4 h-4" />
              {route.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border mt-auto">
        <div className="px-3 py-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
          System Standard
        </div>
      </div>
    </aside>
  );
}
