'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Trophy, Home, LayoutGrid, Medal, Bot, MessageSquare, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks';


const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/contests', label: 'Contests', icon: LayoutGrid },
  { href: '/entries', label: 'My Entries', icon: Trophy },
  { href: '/leaderboard', label: 'Rankings', icon: Medal },
];

const TOOL_ITEMS = [
  { href: '/assistant', label: 'AI Assistant', icon: MessageSquare },
  { href: '/agent', label: 'AI Agent', icon: Bot },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  const { authenticated, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !authenticated) router.push('/');
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) return null;

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col fixed inset-y-0 left-0 bg-surface-card border-r border-border z-40">
        <div className="p-5">
          <Link href="/home" className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg flex items-center bg-gold-400/15 justify-center">
              <Trophy className="h-4 w-4 text-gold-300" />
            </div>
            <span className="text-base font-display font-bold tracking-tight">MatchDay</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <p className="px-3 pt-4 pb-2 text-[10px] font-mono font-medium text-text-muted uppercase tracking-widest">Play</p>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === href
                  ? 'bg-gold-400/10 text-gold-300'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}

          <p className="px-3 pt-6 pb-2 text-[10px] font-mono font-medium text-text-muted uppercase tracking-widest">Tools</p>
          {TOOL_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === href
                  ? 'bg-gold-400/10 text-gold-300'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover w-full"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-surface-card border-b border-border flex items-center px-4 z-40">
        <Link href="/home" className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-gold-400" />
          <span className="font-display font-bold">MatchDay</span>
        </Link>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </main>

      {/* Mobile bottom tabs */}
      <div className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-surface-card border-t border-border flex items-center justify-around z-40">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 text-xs ${
              pathname === href ? 'text-gold-400' : 'text-text-muted'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
