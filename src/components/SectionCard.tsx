
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
        "flex items-center gap-3 text-2xl font-bold mb-6 pb-4 border-b-2", // Increased font-weight, gap, mb, pb and border thickness
        accentHighlight ? "text-accent border-accent/50" : "text-primary border-primary/50" 
      )}>
        <span className={cn(accentHighlight ? "text-accent" : "text-primary", "transform scale-110")}>{icon}</span> {/* Slightly larger icon */}
        {title}
      </h3>
      <div className={cn(
        "text-base leading-relaxed space-y-4", // Added leading-relaxed and space-y
         "prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none" // Added prose for better typography on text content
        )}>
        {children}
      </div>
    </section>
  );
}
