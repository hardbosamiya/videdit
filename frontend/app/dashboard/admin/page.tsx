'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuthStore } from '@/lib/authStore';
import api from '@/lib/api';
import { badgeLabel, timeAgo } from '@/lib/utils';
import { Briefcase, CheckCircle, Star, ArrowRight, Upload, Plus } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, jobsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/jobs/admin/my-jobs'),
        ]);
        setStats(statsRes.data);
        setMyJobs(jobsRes.data.jobs.slice(0, 5));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your assigned editing jobs</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Completed</span>
              <CheckCircle size={16} className="text-green-400" />
            </div>
            <span className="text-3xl font-display">{loading ? '–' : stats?.completedJobs ?? 0}</span>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Badge</span>
              <Star size={16} className="text-brand-400" />
            </div>
            <span className="text-sm font-medium">{user?.badge ? badgeLabel[user.badge] : 'No Badge'}</span>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Active Job</span>
              <Briefcase size={16} className="text-blue-400" />
            </div>
            <span className="text-sm font-medium">{stats?.ongoingJob ? 'Yes' : 'None'}</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Link href="/dashboard/admin/available" className="card hover:border-brand-500/40 transition-colors group flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Plus size={20} className="text-brand-400" />
            </div>
            <div>
              <p className="font-semibold">Browse Available Jobs</p>
              <p className="text-gray-500 text-sm">Pick up a new editing job</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-gray-600 group-hover:text-gray-300" />
          </Link>
          <Link href="/dashboard/admin/jobs" className="card hover:border-brand-500/40 transition-colors group flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Briefcase size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="font-semibold">My Jobs</p>
              <p className="text-gray-500 text-sm">View all assigned work</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-gray-600 group-hover:text-gray-300" />
          </Link>
        </div>

        {/* Recent */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Recent Jobs</h2>
            <Link href="/dashboard/admin/jobs" className="text-brand-400 text-sm flex items-center gap-1 hover:text-brand-300">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-surface-2 rounded-lg animate-pulse"/>)}</div>
          ) : myJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase size={32} className="mx-auto mb-2 text-gray-700" />
              <p>No jobs yet. Browse available jobs to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myJobs.map(job => (
                <Link key={job._id} href={`/dashboard/admin/jobs/${job._id}`}
                  className="flex items-center justify-between p-3 bg-surface-2 rounded-lg hover:bg-surface-3 transition-colors group">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.user?.name} · {timeAgo(job.updatedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={job.status} size="sm" />
                    <ArrowRight size={12} className="text-gray-600 group-hover:text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
