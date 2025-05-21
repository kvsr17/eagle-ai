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
    <Card className={cn("shadow-lg w-full", className)}>
      <CardHeader>
        <CardTitle className={cn("flex items-center gap-2 text-xl", accentHighlight && "text-accent")}>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        {children}
      </CardContent>
    </Card>
  );
}
