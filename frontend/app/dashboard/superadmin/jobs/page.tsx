'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import api from '@/lib/api';
import { timeAgo, getErrorMessage } from '@/lib/utils';
import { ArrowRight, DollarSign, UserCheck, X, Loader2, Briefcase, MessageSquare } from 'lucide-react';

const STATUSES = ['all','pending','price_discussion','ongoing','review','revision','completed'];

export default function SuperAdminJobsPage() {
  const sp = useSearchParams();
  const [jobs, setJobs] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(sp.get('status') || 'all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [priceModal, setPriceModal] = useState<any>(null);
  const [assignModal, setAssignModal] = useState<any>(null);
  const [priceForm, setPriceForm] = useState({ agreedPrice: '', currency: 'USD', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (filter !== 'all') params.set('status', filter);
      const { data } = await api.get(`/jobs/superadmin/all?${params}`);
      setJobs(data.jobs);
      setPages(data.pages);
    } finally { setLoading(false); }
  };

  const fetchAdmins = async () => {
    const { data } = await api.get('/superadmin/admins');
    setAdmins(data.admins.filter((a: any) => a.isActive));
  };

  useEffect(() => { fetchJobs(); }, [filter, page]);
  useEffect(() => { fetchAdmins(); }, []);

  const handleSetPrice = async () => {
    if (!priceForm.agreedPrice) return toast.error('Price is required');
    setSaving(true);
    try {
      await api.patch(`/jobs/${priceModal._id}/set-price`, {
        agreedPrice: Number(priceForm.agreedPrice),
        currency: priceForm.currency,
        notes: priceForm.notes,
      });
      toast.success('Price set — job is now available to admins');
      setPriceModal(null);
      setPriceForm({ agreedPrice: '', currency: 'USD', notes: '' });
      fetchJobs();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleAssign = async (adminId: string) => {
    setSaving(true);
    try {
      await api.patch(`/jobs/${assignModal._id}/assign-admin`, { adminId });
      toast.success('Admin assigned!');
      setAssignModal(null);
      fetchJobs();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">All Jobs</h1>

        {/* Status filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === s ? 'bg-brand-500 text-white' : 'bg-surface-2 text-gray-400 hover:text-white'
              }`}>
              {s === 'all' ? 'All' : s.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i=><div key={i} className="h-24 bg-surface-1 rounded-xl animate-pulse"/>)}</div>
        ) : jobs.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <Briefcase size={40} className="mx-auto mb-3 text-gray-700" />
            No jobs found
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map(job => (
              <div key={job._id} className="card hover:border-brand-500/20 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{job.title}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>👤 {job.user?.name}</span>
                        {job.admin && <span>✂️ {job.admin.name}</span>}
                        {job.agreedPrice && <span className="text-brand-400">${job.agreedPrice} {job.currency}</span>}
                        <span>{timeAgo(job.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <StatusBadge status={job.status} size="sm" />
                    {(job.status === 'pending' || job.status === 'price_discussion') && (
                      <button onClick={() => { setPriceModal(job); setPriceForm({ agreedPrice: String(job.agreedPrice||''), currency: job.currency||'USD', notes: job.superAdminNotes||'' }); }}
                        className="flex items-center gap-1 text-xs bg-brand-500/15 text-brand-400 px-2.5 py-1.5 rounded-lg hover:bg-brand-500/25 transition-colors">
                        <DollarSign size={11} /> Set Price
                      </button>
                    )}
                    {job.status === 'price_discussion' && (
                      <Link href={`/chat/${job._id}`}
                        className="flex items-center gap-1 text-xs bg-blue-500/15 text-blue-400 px-2.5 py-1.5 rounded-lg hover:bg-blue-500/25 transition-colors">
                        <MessageSquare size={11} /> Chat
                      </Link>
                    )}
                    {job.status === 'price_discussion' && !job.admin && job.userAcceptedPrice && (
                      <button onClick={() => setAssignModal(job)}
                        className="flex items-center gap-1 text-xs bg-purple-500/15 text-purple-400 px-2.5 py-1.5 rounded-lg hover:bg-purple-500/25 transition-colors">
                        <UserCheck size={11} /> Assign Admin
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">Prev</button>
            <span className="flex items-center text-sm text-gray-400">{page} / {pages}</span>
            <button onClick={() => setPage(p=>Math.min(pages,p+1))} disabled={page===pages} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* Price modal */}
      {priceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-1 border border-surface-3 rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">Set Price</h2>
              <button onClick={() => setPriceModal(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-400 mb-5">Job: <span className="text-white">{priceModal.title}</span></p>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1.5">Price *</label>
                  <input type="number" className="input" placeholder="e.g. 150" value={priceForm.agreedPrice}
                    onChange={e => setPriceForm(p => ({ ...p, agreedPrice: e.target.value }))} />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-gray-400 mb-1.5">Currency</label>
                  <select className="input" value={priceForm.currency} onChange={e => setPriceForm(p => ({ ...p, currency: e.target.value }))}>
                    {['USD','EUR','GBP','INR','AED'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Notes for admin (optional)</label>
                <textarea className="input resize-none" rows={3} placeholder="Special instructions..."
                  value={priceForm.notes} onChange={e => setPriceForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <button onClick={handleSetPrice} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
                Confirm Price & Open for Admins
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign admin modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-1 border border-surface-3 rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">Assign Admin</h2>
              <button onClick={() => setAssignModal(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Select an admin for: <span className="text-white">{assignModal.title}</span></p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {admins.filter(a => !a.ongoingJob).map(admin => (
                <button key={admin._id} onClick={() => handleAssign(admin._id)} disabled={saving}
                  className="w-full flex items-center gap-3 p-3 bg-surface-2 rounded-lg hover:bg-surface-3 transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-400">
                    {admin.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{admin.name}</p>
                    <p className="text-xs text-gray-500">{admin.completedJobs} jobs · {admin.badge !== 'none' ? admin.badge : 'no badge'}</p>
                  </div>
                  {saving && <Loader2 size={14} className="animate-spin ml-auto" />}
                </button>
              ))}
              {admins.filter(a => !a.ongoingJob).length === 0 && (
                <p className="text-center text-gray-500 py-4 text-sm">All admins are busy</p>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
