'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import api from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { Briefcase, ArrowRight, Plus, Search } from 'lucide-react';

interface Job {
  _id: string; title: string; status: string;
  createdAt: string; updatedAt: string;
  admin?: { name: string; badge: string };
}

const STATUSES = ['all','pending','price_discussion','ongoing','review','revision','completed'];

export default function UserJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '10' });
        if (filter !== 'all') params.set('status', filter);
        const { data } = await api.get(`/jobs/my?${params}`);
        setJobs(data.jobs);
        setPages(data.pages);
      } finally { setLoading(false); }
    };
    fetch();
  }, [filter, page]);

  const filtered = jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">My Jobs</h1>
          <Link href="/dashboard/user/upload" className="btn-primary text-sm flex items-center gap-2">
            <Plus size={14} /> New Job
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input className="input pl-9 text-sm" placeholder="Search jobs..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUSES.map(s => (
              <button key={s} onClick={() => { setFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === s ? 'bg-brand-500 text-white' : 'bg-surface-2 text-gray-400 hover:text-white'
                }`}>
                {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-surface-1 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <Briefcase size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-400 mb-2">No jobs found</p>
            <p className="text-gray-600 text-sm mb-6">Try adjusting your filters or create a new job</p>
            <Link href="/dashboard/user/upload" className="btn-primary text-sm inline-flex items-center gap-2">
              <Plus size={14} /> Create Job
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(job => (
              <Link key={job._id} href={`/dashboard/user/jobs/${job._id}`}
                className="flex items-center justify-between p-4 card hover:border-brand-500/30 transition-colors group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={16} className="text-brand-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{job.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500">Updated {timeAgo(job.updatedAt)}</span>
                      {job.admin && <span className="text-xs text-gray-600">· {job.admin.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={job.status} size="sm" />
                  <ArrowRight size={14} className="text-gray-600 group-hover:text-gray-300 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">Prev</button>
            <span className="flex items-center text-sm text-gray-400">{page} / {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
