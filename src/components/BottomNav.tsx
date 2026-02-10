'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { Home, LayoutGrid, ShieldCheck, User } from 'lucide-react';

export function BottomNav() {
  const { user, loading } = useUser();
  const pathname = usePathname();

  if (loading || !user) return null;

  const isAdmin = user.role === 'ADMIN';

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      active: pathname === '/',
    },
    {
      label: 'Lobby',
      href: '/lobby',
      icon: LayoutGrid,
      active: pathname === '/lobby',
    },
  ];

  if (isAdmin) {
    navItems.push({
      label: 'Admin',
      href: '/admin/login',
      icon: ShieldCheck,
      active: pathname.startsWith('/admin'),
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden">
      <div className="bg-card/80 backdrop-blur-xl border-t border-white/5 pb-safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-6">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-300 relative",
                item.active ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", item.active && "fill-current")} />
              <span className="text-[10px] font-black uppercase tracking-tighter italic">
                {item.label}
              </span>
              {item.active && (
                <div className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary))]" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
