'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { Users, Briefcase, CheckCircle, Clock, ArrowRight, TrendingUp } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/superadmin/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Pending Jobs',   value: stats?.pending,     icon: Clock,        color: 'text-gray-400',   href: '/dashboard/superadmin/jobs?status=pending' },
    { label: 'In Progress',    value: stats?.ongoing,     icon: TrendingUp,   color: 'text-brand-400',  href: '/dashboard/superadmin/jobs?status=ongoing' },
    { label: 'Completed',      value: stats?.completed,   icon: CheckCircle,  color: 'text-green-400',  href: '/dashboard/superadmin/jobs?status=completed' },
    { label: 'Total Users',    value: stats?.totalUsers,  icon: Users,        color: 'text-blue-400',   href: '/dashboard/superadmin/users' },
    { label: 'Active Admins',  value: stats?.totalAdmins, icon: Users,        color: 'text-purple-400', href: '/dashboard/superadmin/admins' },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Super Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Full platform overview and control</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {cards.map(({ label, value, icon: Icon, color, href }) => (
            <Link key={label} href={href} className="card hover:border-brand-500/30 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-xs">{label}</span>
                <Icon size={15} className={color} />
              </div>
              <span className="text-3xl font-display">{loading ? '–' : value ?? 0}</span>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Manage All Jobs', desc: 'Review, price, assign work', href: '/dashboard/superadmin/jobs', color: 'bg-brand-500/10 text-brand-400' },
            { title: 'Manage Admins', desc: 'Create, badge, deactivate', href: '/dashboard/superadmin/admins', color: 'bg-purple-500/10 text-purple-400' },
            { title: 'View Users', desc: 'Browse all registered users', href: '/dashboard/superadmin/users', color: 'bg-blue-500/10 text-blue-400' },
          ].map(({ title, desc, href, color }) => (
            <Link key={href} href={href} className="card hover:border-brand-500/30 transition-colors group flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                <Briefcase size={20} />
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
              <ArrowRight size={15} className="ml-auto text-gray-600 group-hover:text-gray-300" />
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
