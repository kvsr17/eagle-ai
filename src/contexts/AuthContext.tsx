
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider, // Added
  signInWithPopup, // Added
  type User as FirebaseUser
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  loginWithEmailAndPassword: (email: string, pass: string) => Promise<boolean>;
  signupWithEmailAndPassword: (email: string, pass: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>; // Added
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
    return () => unsubscribe();
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

  const googleSignIn = async (): Promise<boolean> => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: 'Google Sign-In Successful', description: 'Welcome!' });
      router.push('/');
      return true;
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      toast({
        title: 'Google Sign-In Failed',
        description: error.message || 'Could not sign in with Google. Please try again.',
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
      setCurrentUser(null);
      toast({ title: 'Signed Out', description: 'You have been successfully signed out.' });
      router.push('/login'); 
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
    signInWithGoogle: googleSignIn, // Added
    logout: logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
