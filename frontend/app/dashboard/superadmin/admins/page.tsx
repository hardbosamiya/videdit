'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { badgeLabel, getErrorMessage } from '@/lib/utils';
import { Plus, Award, Power, X, Loader2, Users } from 'lucide-react';

const BADGES = ['none','bronze','silver','gold','platinum','diamond'];

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [badgeModal, setBadgeModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [badgeForm, setBadgeForm] = useState({ badge: 'none', badgeNote: '' });

  const fetchAdmins = async () => {
    try { const { data } = await api.get('/superadmin/admins'); setAdmins(data.admins); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAdmins(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/superadmin/admins', createForm);
      toast.success('Admin created & welcome email sent!');
      setCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', phone: '' });
      fetchAdmins();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleBadge = async () => {
    setSaving(true);
    try {
      await api.patch(`/superadmin/admins/${badgeModal._id}/badge`, badgeForm);
      toast.success('Badge assigned!');
      setBadgeModal(null);
      fetchAdmins();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleToggle = async (admin: any) => {
    try {
      await api.patch(`/superadmin/admins/${admin._id}/toggle`);
      toast.success(`Admin ${admin.isActive ? 'deactivated' : 'activated'}`);
      fetchAdmins();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Admins</h1>
          <button onClick={() => setCreateModal(true)} className="btn-primary text-sm flex items-center gap-2">
            <Plus size={14} /> New Admin
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 bg-surface-1 rounded-xl animate-pulse"/>)}</div>
        ) : admins.length === 0 ? (
          <div className="card text-center py-12">
            <Users size={40} className="mx-auto text-gray-700 mb-3" />
            <p className="text-gray-400 mb-4">No admins yet</p>
            <button onClick={() => setCreateModal(true)} className="btn-primary text-sm">Create First Admin</button>
          </div>
        ) : (
          <div className="space-y-3">
            {admins.map(admin => (
              <div key={admin._id} className={`card transition-colors ${!admin.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold flex-shrink-0">
                      {admin.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{admin.name}</p>
                        {admin.badge !== 'none' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full badge-${admin.badge}`}>{badgeLabel[admin.badge]}</span>
                        )}
                        {!admin.isActive && <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Inactive</span>}
                      </div>
                      <p className="text-sm text-gray-500">{admin.email} · {admin.completedJobs} jobs</p>
                      {admin.ongoingJob && <p className="text-xs text-brand-400">Currently working on: {admin.ongoingJob.title}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => { setBadgeModal(admin); setBadgeForm({ badge: admin.badge || 'none', badgeNote: admin.badgeNote || '' }); }}
                      className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors" title="Assign badge">
                      <Award size={16} />
                    </button>
                    <button onClick={() => handleToggle(admin)}
                      className={`p-2 rounded-lg transition-colors ${admin.isActive ? 'text-red-400 hover:bg-red-500/10' : 'text-green-400 hover:bg-green-500/10'}`}
                      title={admin.isActive ? 'Deactivate' : 'Activate'}>
                      <Power size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create admin modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-1 border border-surface-3 rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">Create Admin</h2>
              <button onClick={() => setCreateModal(false)} className="text-gray-500 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Name *</label>
                <input className="input" placeholder="Admin Name" value={createForm.name}
                  onChange={e => setCreateForm(p => ({...p, name: e.target.value}))} required />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Email *</label>
                <input type="email" className="input" placeholder="admin@example.com" value={createForm.email}
                  onChange={e => setCreateForm(p => ({...p, email: e.target.value}))} required />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Password *</label>
                <input type="password" className="input" placeholder="Min. 6 characters" value={createForm.password}
                  onChange={e => setCreateForm(p => ({...p, password: e.target.value}))} required />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Phone</label>
                <input type="tel" className="input" placeholder="+1 234 567 8900" value={createForm.phone}
                  onChange={e => setCreateForm(p => ({...p, phone: e.target.value}))} />
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>} Create Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Badge modal */}
      {badgeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-1 border border-surface-3 rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">Assign Badge</h2>
              <button onClick={() => setBadgeModal(null)} className="text-gray-500 hover:text-white"><X size={18}/></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Admin: <span className="text-white">{badgeModal.name}</span></p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Badge Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {BADGES.map(b => (
                    <button key={b} type="button" onClick={() => setBadgeForm(p => ({...p, badge: b}))}
                      className={`p-2 rounded-lg text-xs font-medium transition-colors border ${
                        badgeForm.badge === b ? `badge-${b} border-current` : 'bg-surface-2 text-gray-400 border-surface-3'
                      }`}>
                      {badgeLabel[b]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Note (optional)</label>
                <input className="input text-sm" placeholder="Reason for badge..." value={badgeForm.badgeNote}
                  onChange={e => setBadgeForm(p => ({...p, badgeNote: e.target.value}))} />
              </div>
              <button onClick={handleBadge} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin"/> : <Award size={14}/>} Assign Badge
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
