'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { badgeLabel } from '@/lib/utils';
import {
  LayoutDashboard, Upload, MessageSquare, LogOut,
  Menu, X, Users, Briefcase, Settings, Phone, Crown, ChevronRight
} from 'lucide-react';

const navItems = {
  user: [
    { href: '/dashboard/user', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/user/jobs', label: 'My Jobs', icon: Briefcase },
    { href: '/dashboard/user/upload', label: 'New Upload', icon: Upload },
    { href: '/contact', label: 'Contact', icon: Phone },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/admin/jobs', label: 'My Jobs', icon: Briefcase },
    { href: '/dashboard/admin/available', label: 'Available Jobs', icon: Upload },
  ],
  superadmin: [
    { href: '/dashboard/superadmin', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/superadmin/jobs', label: 'All Jobs', icon: Briefcase },
    { href: '/dashboard/superadmin/admins', label: 'Admins', icon: Users },
    { href: '/dashboard/superadmin/users', label: 'Users', icon: Users },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) router.push('/auth/login');
  }, [user, router]);

  if (!user) return null;

  const items = navItems[user.role] || navItems.user;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-surface-3">
        <Link href="/" className="font-display text-2xl tracking-widest text-brand-500">VIDEDIT</Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-surface-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-semibold text-sm flex-shrink-0">
            {user.profilePic
              ? <img src={user.profilePic} alt="" className="w-full h-full rounded-full object-cover" />
              : user.name.charAt(0).toUpperCase()
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 capitalize">{user.role.replace('superadmin', 'super admin')}</span>
              {user.badge && user.badge !== 'none' && (
                <span className={`text-xs px-1.5 py-0.5 rounded badge-${user.badge}`}>
                  {badgeLabel[user.badge]}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard/user' && href !== '/dashboard/admin' && href !== '/dashboard/superadmin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                active
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                  : 'text-gray-400 hover:bg-surface-2 hover:text-white'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
              {active && <ChevronRight size={12} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-surface-3">
        <button
          onClick={() => { logout(); router.push('/'); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-all"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-surface-1 border-r border-surface-3 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-surface-1 border-r border-surface-3 z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-surface-3 bg-surface-1 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={20} />
          </button>
          <span className="font-display tracking-widest text-brand-500">VIDEDIT</span>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
