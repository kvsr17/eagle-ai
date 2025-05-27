
"use client";

import Link from 'next/link';
import { Scale, User, LogIn, LogOut, FilePlus } from 'lucide-react'; // Added icons
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';

export function Navbar() {
  const { currentUser, logout, loading } = useAuth();

  return (
    <nav className="bg-background text-foreground shadow-md no-print border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3 text-xl font-semibold text-primary hover:opacity-90 transition-opacity">
          <Scale size={28} />
          <span>LegalForesight AI</span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {loading ? (
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div> // Placeholder for loading
          ) : currentUser ? (
            <>
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary">
                <Link href="/profile">
                  <User className="h-5 w-5 mr-1 sm:mr-2" />
                  Profile
                </Link>
              </Button>
              <Button variant="outline" onClick={logout} className="border-primary/50 text-primary hover:bg-primary/5 hover:text-primary">
                <LogOut className="h-5 w-5 mr-1 sm:mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary">
                <Link href="/login">
                  <LogIn className="h-5 w-5 mr-1 sm:mr-2" />
                  Login
                </Link>
              </Button>
              <Button variant="default" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/signup">
                  <FilePlus className="h-5 w-5 mr-1 sm:mr-2" />
                  Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
