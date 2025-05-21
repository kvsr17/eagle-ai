
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser
} from 'firebase/auth';
import { app } from '@/lib/firebase'; // Ensure your Firebase app is initialized and exported from here
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast'; // Ensure useToast hook is correctly set up

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  loginWithEmailAndPassword: (email: string, pass: string) => Promise<boolean>;
  signupWithEmailAndPassword: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [auth]);

  const login = async (email: string, password: string):Promise<boolean> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/');
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
      setLoading(false);
      return false;
    }
  };

  const signup = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // currentUser will be set by onAuthStateChanged
      toast({ title: 'Signup Successful', description: 'Welcome to LegalForesight AI!' });
      router.push('/');
      return true;
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: 'Signup Failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
      return false;
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setCurrentUser(null); // Explicitly set current user to null
      toast({ title: 'Signed Out', description: 'You have been successfully signed out.' });
      router.push('/login'); // Redirect to login page after logout
    } catch (error: any) {
       console.error("Logout error:", error);
      toast({
        title: 'Logout Failed',
        description: error.message || 'An error occurred during sign out.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  const value: AuthContextType = {
    currentUser,
    loading,
    loginWithEmailAndPassword: login,
    signupWithEmailAndPassword: signup,
    logout: logoutUser,
  };

  // Always render the Provider and its children.
  // Consuming components will use the `loading` state from `useAuth()`
  // to decide what to display (e.g., a loading spinner).
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
