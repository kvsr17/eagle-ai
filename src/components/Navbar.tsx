
"use client";

import Link from 'next/link';
import { Scale } from 'lucide-react'; // Using Scale as a generic legal icon

export function Navbar() {
  return (
    <nav className="bg-primary text-primary-foreground shadow-md no-print">
      <div className="container mx-auto px-4 py-3 flex items-center h-14"> {/* Increased height slightly */}
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold hover:opacity-90 transition-opacity">
          <Scale size={24} />
          <span>LegalForesight AI</span>
        </Link>
        {/* Future links or auth status can go here */}
      </div>
    </nav>
  );
}
