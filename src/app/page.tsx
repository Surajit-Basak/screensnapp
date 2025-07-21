import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import Image from 'next/image';
import { Camera, Monitor, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24 text-center">
          <Badge className="mb-4">
            <Zap className="w-3 h-3 -ml-1 mr-1.5" />
            Effortless & Instant
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
            Capture Your Screen with One Click
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            ScreenSnapp is the simplest way to record your screen or take instant
            screenshots. Secure, private, and blazingly fast.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/dashboard">Get Started for Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 md:py-24 text-center">
           <Image
            src="https://placehold.co/1200x600.png"
            alt="ScreenSnapp Dashboard Preview"
            width={1200}
            height={600}
            className="rounded-xl shadow-2xl mx-auto"
            data-ai-hint="app user interface"
          />
        </section>

        <section id="features" className="bg-muted/50 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                Everything You Need, Nothing You Don&apos;t
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
                Our focused feature set makes screen capturing a breeze.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                   <Monitor className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Screen Recording</h3>
                <p className="text-muted-foreground">
                  Record your entire screen or a specific application with optional microphone audio. Perfect for tutorials and demos.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm">
                 <div className="p-3 bg-primary/10 rounded-full mb-4">
                   <Camera className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Screenshots</h3>
                <p className="text-muted-foreground">
                  Quickly capture a snapshot of your screen. Ideal for sharing information or documenting issues.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm">
                 <div className="p-3 bg-primary/10 rounded-full mb-4">
                   <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Access</h3>
                <p className="text-muted-foreground">
                  Your captures are available immediately. Download them directly to your computer without any waiting.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-background border-t">
          <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} ScreenSnapp. All rights reserved.</p>
          </div>
      </footer>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-primary ${className}`}>
      {children}
    </div>
  )
}
