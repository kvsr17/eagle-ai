
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { AuthProvider } from '@/contexts/AuthContext'; // Added AuthProvider
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LegalForesight AI',
  description: 'Predictive Legal Document Analysis by LegalForesight AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <AuthProvider> {/* Wrapped with AuthProvider */}
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8 main-container-print-padding">
            {children}
          </main>
          <div className="no-print">
            <Toaster />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
