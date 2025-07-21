'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Home, Settings, UserCircle } from 'lucide-react';

const sidebarNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <Header />
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
            <div className="h-full py-6 pr-6 md:py-8">
               <nav className="relative flex flex-col gap-2">
                 {sidebarNavItems.map((item, index) => (
                    <Link
                        key={index}
                        href={item.href}
                        className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        pathname === item.href && "bg-muted text-primary"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </Link>
                    ))}
               </nav>
            </div>
        </aside>
        <main className="flex w-full flex-col overflow-hidden py-6 md:py-8">
            {children}
        </main>
      </div>
    </>
  );
}
