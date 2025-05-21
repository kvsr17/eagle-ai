
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, ShieldCheck } from 'lucide-react';
import { LoadingIndicator } from '@/components/LoadingIndicator';

export default function ProfilePage() {
  const { currentUser, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  const handleLogout = async () => {
    await logout();
    // The logout function in AuthContext handles redirection to /login
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator text="Loading profile..." />
      </div>
    );
  }

  if (!currentUser) {
    // This state should be brief as useEffect will redirect.
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator text="Redirecting to login..." />
      </div>
    );
  }

  const userInitial = currentUser.email ? currentUser.email.charAt(0).toUpperCase() : '?';

  return (
    <div className="flex justify-center items-start pt-10 min-h-screen">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Avatar className="mx-auto h-24 w-24 mb-4 border-2 border-primary p-1">
            <AvatarImage src={`https://placehold.co/100x100.png?text=${userInitial}`} alt={currentUser.email || 'User'} data-ai-hint="user avatar" />
            <AvatarFallback className="text-3xl bg-primary text-primary-foreground">{userInitial}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">User Profile</CardTitle>
          <CardDescription>Manage your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <User className="mr-2 h-5 w-5 text-primary" />
              <span className="font-medium text-muted-foreground">Email:</span>
              <span className="ml-2 text-foreground">{currentUser.email}</span>
            </div>
            <div className="flex items-center text-sm">
              <ShieldCheck className="mr-2 h-5 w-5 text-green-500" />
              <span className="font-medium text-muted-foreground">Status:</span>
              <span className="ml-2 text-green-600">Verified</span>
            </div>
          </div>
          
          <Button onClick={handleLogout} className="w-full" variant="destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

