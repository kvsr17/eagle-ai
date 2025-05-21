import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  accentHighlight?: boolean;
  className?: string;
}

export function SectionCard({ title, icon, children, accentHighlight = false, className }: SectionCardProps) {
  return (
    <section className={cn("w-full", className)}>
      <h3 className={cn(
        "flex items-center gap-2 text-2xl font-semibold mb-4 pb-2 border-b border-gray-300",
        accentHighlight ? "text-accent" : "text-primary"
      )}>
        {icon}
        {title}
      </h3>
      <div className={cn("text-base", accentHighlight && "text-on-accent")}>
        {children}
      </div>
    </section>
  );
}
