'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  User,
  Compass,
  Users,
  Settings,
  LogOut,
  Bot,
  Menu,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/profile', icon: User, label: 'My Identity' },
  { href: '/discover', icon: Compass, label: 'Discover' },
  { href: '/matches', icon: Users, label: 'Matches' },
  { href: '/agents', icon: Bot, label: 'Agent Hub' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

const BASE_PATH = '/social';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    if (!confirm('Sign out of TACIT? On shared computers, clear your browser data after signing out.')) {
      return;
    }

    // Clear the user's private key from IndexedDB before signing out.
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const dbName = `tacit-${user.id}`;
        const backend = new (await import('@/lib/tacit/indexed-db-backend')).IndexedDBBackend(dbName);
        await backend.close();
        indexedDB.deleteDatabase(dbName);
      }
    } catch (e) {
      console.warn('IndexedDB cleanup failed during sign-out:', e);
    }

    await supabase.auth.signOut();
    router.push('/login');
  }

  function isActive(href: string): boolean {
    const fullPath = `${BASE_PATH}${href}`;
    return pathname === fullPath || pathname.startsWith(fullPath + '/');
  }

  const navContent = (
    <>
      {/* Logo */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <Shield className="w-7 h-7 text-accent" />
          <span className="text-xl font-bold">TACIT</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${
              isActive(href)
                ? 'bg-accent/10 text-accent-bright'
                : 'text-text-muted hover:text-text hover:bg-bg-elevated'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-danger hover:bg-danger/5 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-bg-card border border-border rounded-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-text" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-bg-card border-r border-border flex flex-col z-50 transition-transform md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 text-text-muted hover:text-text"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="w-64 h-screen bg-bg-card border-r border-border flex-col fixed left-0 top-0 hidden md:flex">
        {navContent}
      </aside>
    </>
  );
}
