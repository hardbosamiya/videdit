'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Users, Search } from 'lucide-react';

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    setLoading(true);
    api.get(`/superadmin/users?page=${page}&limit=${LIMIT}`)
      .then(r => { setUsers(r.data.users); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Users</h1>
            <p className="text-gray-400 text-sm mt-1">{total} registered users</p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input className="input pl-9 text-sm w-56" placeholder="Search users..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(8)].map((_,i)=><div key={i} className="h-14 bg-surface-1 rounded-lg animate-pulse"/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12">
            <Users size={40} className="mx-auto text-gray-700 mb-3"/>
            <p className="text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-3">
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">User</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 hidden md:table-cell">Phone</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 hidden lg:table-cell">Joined</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-3">
                {filtered.map(user => (
                  <tr key={user._id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-xs text-brand-400 flex-shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-400">{user.email}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-400">{user.phone || '–'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > LIMIT && (
          <div className="flex justify-center gap-2 mt-4">
            <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">Prev</button>
            <span className="flex items-center text-sm text-gray-400">Page {page}</span>
            <button onClick={() => setPage(p=>p+1)} disabled={users.length < LIMIT} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
