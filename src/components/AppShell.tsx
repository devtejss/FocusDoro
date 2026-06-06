import { type ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="min-h-screen bg-background pb-24 pt-[env(safe-area-inset-top)]">
      {title ? (
        <header className="px-5 pt-6 pb-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        </header>
      ) : null}
      <main className="mx-auto max-w-md px-5">{children}</main>
      <BottomNav />
    </div>
  );
}