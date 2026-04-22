'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { timeAgo, getErrorMessage } from '@/lib/utils';
import { Briefcase, User, DollarSign, Lock, Loader2 } from 'lucide-react';

export default function AdminAvailableJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const { data } = await api.get('/jobs/admin/available');
      setJobs(data.jobs);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleAccept = async (jobId: string) => {
    if (!confirm('Accept this job? It will be locked to you exclusively.')) return;
    setAccepting(jobId);
    try {
      const { data } = await api.post(`/jobs/${jobId}/accept`);
      toast.success('Job accepted! You can now start working on it.');
      router.push(`/dashboard/admin/jobs/${data.job._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      fetchJobs();
    } finally { setAccepting(null); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Available Jobs</h1>
          <p className="text-gray-400 text-sm mt-1">Jobs ready to be accepted — first come, first served</p>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-32 bg-surface-1 rounded-xl animate-pulse"/>)}</div>
        ) : jobs.length === 0 ? (
          <div className="card text-center py-16">
            <Briefcase size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-400">No jobs available right now</p>
            <p className="text-gray-600 text-sm mt-1">Check back soon — new jobs appear after price discussion</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job._id} className="card hover:border-brand-500/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    {job.description && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{job.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <User size={13} /> {job.user?.name}
                      </span>
                      {job.agreedPrice && (
                        <span className="flex items-center gap-1.5 text-brand-400 font-medium">
                          <DollarSign size={13} /> {job.agreedPrice} {job.currency}
                        </span>
                      )}
                      <span>{timeAgo(job.updatedAt)}</span>
                    </div>
                    {/* Assets summary */}
                    <div className="flex gap-3 mt-3">
                      {job.sampleVideo && (
                        <span className="text-xs bg-surface-2 px-2 py-1 rounded text-gray-400">
                          📹 Sample video
                        </span>
                      )}
                      {job.clips?.length > 0 && (
                        <span className="text-xs bg-surface-2 px-2 py-1 rounded text-gray-400">
                          🎬 {job.clips.length} clip{job.clips.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {job.superAdminNotes && (
                      <p className="mt-3 text-xs text-gray-400 bg-surface-2 rounded-lg p-2">
                        <span className="text-gray-600">Notes: </span>{job.superAdminNotes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAccept(job._id)}
                    disabled={!!accepting}
                    className="btn-primary flex items-center gap-2 text-sm flex-shrink-0"
                  >
                    {accepting === job._id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Lock size={14} />
                    )}
                    Accept Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
