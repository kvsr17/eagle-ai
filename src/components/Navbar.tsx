
import { Zap } from 'lucide-react'; // Changed icon to Zap for foresight
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-primary text-primary-foreground shadow-md no-print">
      <div className="container mx-auto px-4 py-3 flex items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Zap size={28} /> 
          <h1 className="text-xl font-semibold">LegalForesight AI</h1> {/* Updated App Name */}
        </Link>
      </div>
    </nav>
  );
}
