
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, LogOut, ShieldCheck, Loader2, Mail } from 'lucide-react';

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
    // router.push('/login'); // AuthContext logout already handles redirect
  };

  if (authLoading || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">
            {authLoading ? "Loading profile..." : "Redirecting to login..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start pt-10 min-h-screen bg-background px-4">
      <Card className="w-full max-w-md shadow-xl rounded-xl border border-border">
        <CardHeader className="text-center">
          <User className="mx-auto h-16 w-16 text-primary mb-4 p-3 bg-primary/10 rounded-full" />
          <CardTitle className="text-2xl font-semibold text-foreground">User Profile</CardTitle>
          <CardDescription className="text-muted-foreground">Manage your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center text-sm p-3.5 bg-muted/50 rounded-md shadow-sm">
              <Mail className="mr-3.5 h-5 w-5 text-primary" />
              <span className="font-medium text-muted-foreground">Email:</span>
              <span className="ml-2 text-foreground break-all">{currentUser?.email}</span>
            </div>
            <div className="flex items-center text-sm p-3.5 bg-muted/50 rounded-md shadow-sm">
              <ShieldCheck className="mr-3.5 h-5 w-5 text-green-500" />
              <span className="font-medium text-muted-foreground">Status:</span>
              <span className="ml-2 text-green-600 font-semibold">Verified</span>
            </div>
          </div>
          <Button onClick={handleLogout} className="w-full h-11 text-base shadow-md" variant="destructive" disabled={authLoading}>
            {authLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="mr-2 h-5 w-5" />}
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
