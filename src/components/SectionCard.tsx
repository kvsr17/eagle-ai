
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Card components are not typically used directly inside SectionCard
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  accentHighlight?: boolean; // Keeps existing accent highlight for some sections
  className?: string;
}

export function SectionCard({ title, icon, children, accentHighlight = false, className }: SectionCardProps) {
  return (
    <section className={cn("w-full", className)}>
      <h3 className={cn(
        "flex items-center gap-2 text-2xl font-semibold mb-4 pb-2 border-b",
        accentHighlight ? "text-accent border-accent/50" : "text-primary border-primary/50" 
        // Use primary color for title by default, or accent if specified
      )}>
        {icon}
        {title}
      </h3>
      <div className={cn(
        "text-base", 
        accentHighlight && "text-on-accent" // text-on-accent for content only if accentHighlight is true
        // Default text color will be --foreground which is suitable for non-accented sections
        )}>
        {children}
      </div>
    </section>
  );
}
