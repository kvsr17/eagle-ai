
import type { ReactNode } from 'react';
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
        "flex items-center gap-3 text-2xl font-semibold mb-6 pb-3 border-b-2", // Increased gap, mb, pb and border thickness
        accentHighlight ? "text-accent border-accent/60" : "text-primary border-primary/60" 
      )}>
        <span className={cn(accentHighlight ? "text-accent" : "text-primary")}>{icon}</span>
        {title}
      </h3>
      <div className={cn(
        "text-base", 
        // If accentHighlight is true, the content text color might need adjustment if text-on-accent is defined globally for bg-accent-light areas.
        // For now, it defaults to foreground which should be fine for most cases.
        // If using bg-accent-light within children, ensure text within those areas use text-on-accent.
        // The component itself does not apply text-on-accent directly to its children div.
        )}>
        {children}
      </div>
    </section>
  );
}
