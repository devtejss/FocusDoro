import { Link, useRouterState } from "@tanstack/react-router";
import { Timer, ListChecks, BarChart3, Flame, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

const items = [
  { to: "/timer", icon: Timer, key: "timer" as const },
  { to: "/tasks", icon: ListChecks, key: "tasks" as const },
  { to: "/analytics", icon: BarChart3, key: "analytics" as const },
  { to: "/stats", icon: Flame, key: "stats" as const },
  { to: "/settings", icon: Settings, key: "settings" as const },
];

export function BottomNav() {
  const { t } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/85 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md items-center justify-between px-2 py-2">
        {items.map(({ to, icon: Icon, key }) => {
          const active = path === to || (to !== "/" && path.startsWith(to));
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors ${
                  active ? "text-brand" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span>{t(`nav.${key}`)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}