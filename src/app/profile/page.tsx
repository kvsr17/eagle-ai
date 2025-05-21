
"use client";

// import { useEffect } from 'react'; // Removed
// import { useAuth } from '@/contexts/AuthContext'; // Removed
// import { useRouter } from 'next/navigation'; // Removed
// import { Button } from '@/components/ui/button'; // Removed, unless needed for other non-auth actions
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Removed
// import { User, LogOut, ShieldCheck } from 'lucide-react'; // Removed
// import { LoadingIndicator } from '@/components/LoadingIndicator'; // Removed

export default function ProfilePage() {
  // const { currentUser, logout, loading: authLoading } = useAuth(); // Removed
  // const router = useRouter(); // Removed

  // useEffect(() => { // Removed
  //   if (!authLoading && !currentUser) {
  //     router.push('/login');
  //   }
  // }, [currentUser, authLoading, router]);

  // const handleLogout = async () => { // Removed
  //   await logout();
  // };

  // if (authLoading) { // Removed
  //   return (
  //     <div className="flex justify-center items-center min-h-screen">
  //       <LoadingIndicator text="Loading profile..." />
  //     </div>
  //   );
  // }

  // if (!currentUser) { // Removed
  //   return (
  //     <div className="flex justify-center items-center min-h-screen">
  //       <LoadingIndicator text="Redirecting to login..." />
  //     </div>
  //   );
  // }

  // const userInitial = currentUser.email ? currentUser.email.charAt(0).toUpperCase() : '?'; // Removed

  return (
    <div className="flex justify-center items-start pt-10 min-h-screen">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Profile Page</CardTitle>
          <CardDescription>This page is a placeholder.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            User profile functionality will be implemented here.
          </p>
          {/*
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
          */}
        </CardContent>
      </Card>
    </div>
  );
}
