'use client';
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { Inter } from 'next/font/google';
import { useEffect } from 'react';

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

  useEffect(() => {
    // Attempt to request permissions early to solve the policy issue.
    // This is a bit of a workaround for difficult iframe environments.
    const requestPermissions = async () => {
      try {
        // We request and immediately stop the stream.
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        // We can ignore the error here. The goal is to prompt the user
        // for permission if the browser decides it's necessary.
        // The actual recording component will handle errors if permission is denied.
        console.log("Pre-permission request:", error);
      }
    };

    // We only need to do this once.
    if (document.readyState === 'complete') {
        // requestPermissions();
    } else {
      // window.addEventListener('load', requestPermissions);
      // return () => window.removeEventListener('load', requestPermissions);
    }
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
                {children}
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}