'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header';
import { Home, Settings } from 'lucide-react';

const sidebarNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r bg-muted/40 p-4 md:flex">
          <nav className="flex flex-col gap-2 font-medium">
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
        </aside>
        <main className="flex w-full flex-col overflow-auto p-4 md:p-8">
            {children}
        </main>
      </div>
    </div>
  );
}
