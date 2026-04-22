'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import api from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { Briefcase, ArrowRight } from 'lucide-react';

export default function AdminMyJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/jobs/admin/my-jobs')
      .then(r => setJobs(r.data.jobs))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">My Assigned Jobs</h1>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 bg-surface-1 rounded-xl animate-pulse"/>)}</div>
        ) : jobs.length === 0 ? (
          <div className="card text-center py-16">
            <Briefcase size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-400 mb-4">No assigned jobs yet</p>
            <Link href="/dashboard/admin/available" className="btn-primary text-sm">Browse Available Jobs</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map(job => (
              <Link key={job._id} href={`/dashboard/admin/jobs/${job._id}`}
                className="flex items-center justify-between p-4 card hover:border-brand-500/30 transition-colors group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={16} className="text-brand-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.user?.name} · {timeAgo(job.updatedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={job.status} size="sm" />
                  <ArrowRight size={14} className="text-gray-600 group-hover:text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
