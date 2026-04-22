'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuthStore } from '@/lib/authStore';
import api from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { Plus, Briefcase, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface Job {
  _id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  admin?: { name: string; badge: string };
  deliveredVideo?: { url: string };
}

export default function UserDashboard() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, ongoing: 0, completed: 0 });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await api.get('/jobs/my?limit=5');
        setJobs(data.jobs);
        const pending = data.jobs.filter((j: Job) => j.status === 'pending' || j.status === 'price_discussion').length;
        const ongoing = data.jobs.filter((j: Job) => ['ongoing', 'review', 'revision'].includes(j.status)).length;
        const completed = data.jobs.filter((j: Job) => j.status === 'completed').length;
        setStats({ pending, ongoing, completed });
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-gray-400 text-sm mt-1">Here's what's happening with your projects</p>
          </div>
          <Link href="/dashboard/user/upload" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> New Job
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-gray-400' },
            { label: 'In Progress', value: stats.ongoing, icon: AlertCircle, color: 'text-brand-400' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-sm">{label}</span>
                <Icon size={16} className={color} />
              </div>
              <span className="text-3xl font-display tracking-wide">{value}</span>
            </div>
          ))}
        </div>

        {/* Recent Jobs */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Recent Jobs</h2>
            <Link href="/dashboard/user/jobs" className="text-brand-400 text-sm hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-surface-2 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">No jobs yet. Upload your first project!</p>
              <Link href="/dashboard/user/upload" className="btn-primary text-sm">
                <Plus size={14} className="inline mr-1" /> Create Job
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <Link key={job._id} href={`/dashboard/user/jobs/${job._id}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase size={14} className="text-brand-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{job.title}</p>
                      <p className="text-xs text-gray-500">{timeAgo(job.updatedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={job.status} size="sm" />
                    <ArrowRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
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
