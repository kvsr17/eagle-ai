
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { Loader2, User, LogOut } from 'lucide-react';

export function Navbar() {
  const { currentUser, logout, loading: authLoading } = useAuth();

  return (
    <nav className="bg-primary text-primary-foreground shadow-md no-print">
      <div className="container mx-auto px-4 py-3 flex items-center h-12">
        <div className="flex-grow"></div> {/* This pushes content to the right */}
        <div className="flex items-center space-x-3">
          {authLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
          ) : currentUser ? (
            <>
              <Button variant="ghost" asChild className="hover:bg-primary/80">
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-5 w-5" /> Profile
                </Link>
              </Button>
              <Button variant="secondary" onClick={logout} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <LogOut className="mr-2 h-5 w-5" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              {/* Login and Sign Up buttons are intentionally removed for unauthenticated users */}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
