'use client';
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { Inter } from 'next/font/google';
import { useState, useEffect } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Since we are moving metadata to a client component, we can't export it directly.
// This is a common approach for this scenario.
const AppMetadata = () => (
  <>
    <title>ScreenSnapp - Instant Screen Recording & Snapshots</title>
    <meta
      name="description"
      content="A user-friendly platform to record your screen, capture audio, and take screenshots with ease. Save locally or get a temporary cloud link."
    />
  </>
);


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
       <head>
          <AppMetadata />
       </head>
      <body className={`${inter.variable} font-body antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
                {isMounted ? children : null}
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
