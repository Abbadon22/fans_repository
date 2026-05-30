import type { ReactNode } from "react";

interface ContentHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function ContentHeader({ title, subtitle, actions }: ContentHeaderProps) {
  return (
    <header className="content-header flex shrink-0 items-start justify-between gap-4 border-b border-line px-8 py-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
