import type { ReactNode } from "react";

interface ViewHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function ViewHeader({ title, subtitle, action }: ViewHeaderProps) {
  return (
    <header className="shrink-0 border-b border-line px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          {subtitle && <p className="mt-1 truncate text-sm text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
