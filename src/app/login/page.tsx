
"use client";

import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { ScanEye, Mail, Lock, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25C22.56 11.45 22.48 10.68 22.34 9.93H12V14.4H18.04C17.73 15.71 16.96 16.82 15.82 17.54V20.03H19.01C21.22 18.04 22.56 15.39 22.56 12.25Z" fill="#4285F4"/>
    <path d="M12 23C15.16 23 17.82 21.95 19.01 20.03L15.82 17.54C14.79 18.23 13.5 18.62 12 18.62C9.37 18.62 7.15 16.96 6.35 14.71H3.04V17.22C4.56 19.94 7.98 23 12 23Z" fill="#34A853"/>
    <path d="M6.35 14.71C6.16 14.16 6.05 13.58 6.05 13C6.05 12.42 6.16 11.84 6.35 11.29V8.78H3.04C2.13 10.57 1.59 11.72 1.59 13C1.59 14.28 2.13 15.43 3.04 17.22L6.35 14.71Z" fill="#FBBC05"/>
    <path d="M12 7.38C13.85 7.38 15.21 8.13 15.82 8.68L19.08 5.47C17.82 4.31 15.16 3 12 3C7.98 3 4.56 5.06 3.04 8.78L6.35 11.29C7.15 9.04 9.37 7.38 12 7.38Z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  const { loginWithEmailAndPassword, signInWithGoogle, loading: authLoading, currentUser } = useAuth();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);


  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    await loginWithEmailAndPassword(data.email, data.password);
  };
  
  if (authLoading && currentUser) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  if (currentUser && !authLoading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-background">
        <p className="text-muted-foreground">Already logged in. Redirecting...</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 py-12">
      <Card className="w-full max-w-sm shadow-xl rounded-xl border border-border">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-3">
            <ScanEye className="mx-auto h-12 w-12 text-primary" />
            <p className="text-xl font-semibold text-foreground">LegalForesight AI</p>
            <h1 className="text-3xl font-bold text-foreground">Sign In</h1>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input type="email" placeholder="Email" {...field} className="pl-10 h-12 text-base shadow-sm" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                     <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input type="password" placeholder="Password" {...field} className="pl-10 h-12 text-base shadow-sm" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                style={{ backgroundColor: '#4285F4', '--hover-bg-color': '#3a77d9' } as React.CSSProperties}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg-color)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4285F4'}
                disabled={authLoading}
              >
                {authLoading && !currentUser ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 text-base shadow-sm border-border hover:bg-muted/50"
            onClick={() => signInWithGoogle()}
            disabled={authLoading}
          >
            {authLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                <span className="ml-2">Sign in with Google</span>
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-4">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
