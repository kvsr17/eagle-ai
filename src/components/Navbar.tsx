import { Gavel } from 'lucide-react';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Gavel size={28} />
          <h1 className="text-xl font-semibold">LegalEagle AI</h1>
        </Link>
      </div>
    </nav>
  );
}
