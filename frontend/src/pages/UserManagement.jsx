import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { userService } from '../lib/userService';
import { VALID_ROLES } from '../constants';
import { useAuth } from '../hooks/useAuth';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    setError('');
    setSuccessMsg('');
    try {
      await userService.updateRole(userId, newRole);
      setSuccessMsg(`User role updated to "${newRole}".`);
      await fetchUsers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err.message || 'Failed to update user role.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchEmail = u.email && u.email.toLowerCase().includes(q);
    const matchName = u.name && u.name.toLowerCase().includes(q);
    const matchRole = u.role && u.role.toLowerCase().includes(q);
    return matchEmail || matchName || matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-asset-light uppercase flex items-center gap-2.5">
            <Shield className="h-5 w-5 text-emerald-400" />
            User Roles & Access Control
          </h2>
          <p className="text-xs text-stone-400 font-mono mt-1">
            Admin console: manage system roles and user permissions across PeoplePay360
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 px-4 py-3 rounded-lg text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-950/30 border border-red-800/40 text-red-300 px-4 py-3 rounded-lg text-xs font-mono flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="glass-panel p-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email, name, or role..."
            className="w-full h-9 bg-black/40 border border-glass-border rounded-md pl-9 pr-3 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-3 glass-panel">
          <div className="h-8 w-8 rounded-full border-2 border-stone-800 border-t-emerald-500 animate-spin"></div>
          <p className="text-xs text-stone-400 font-mono">Loading user access accounts...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center glass-panel">
          <UserCheck className="h-10 w-10 text-stone-600 mx-auto mb-3" />
          <p className="text-sm text-stone-400 font-medium">No user accounts found.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden border border-glass-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 border-b border-glass-border text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono">
                <tr>
                  <th className="px-6 py-3.5">User Identity</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Linked Employee ID</th>
                  <th className="px-6 py-3.5">Current Role</th>
                  <th className="px-6 py-3.5">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {filteredUsers.map((u) => {
                  const isSelf = u.uid === currentUser?.uid;

                  return (
                    <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-asset-light block">
                            {u.name || 'Anonymous User'}
                          </span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 text-emerald-400 font-mono">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-500 font-mono">
                          UID: {u.uid.substring(0, 10)}...
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono text-stone-300">
                        {u.email || '—'}
                      </td>

                      <td className="px-6 py-4 font-mono text-stone-400 text-[11px]">
                        {u.employeeId || 'Not linked'}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase font-mono tracking-wider border ${
                            u.role === 'Admin'
                              ? 'bg-purple-950/40 text-purple-400 border-purple-500/30'
                              : u.role?.startsWith('HR')
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                              : 'bg-stone-900 text-stone-400 border-stone-800'
                          }`}
                        >
                          <Shield className="h-3 w-3" />
                          {u.role || 'Employee'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            disabled={updatingId === u.uid}
                            value={u.role || 'Employee'}
                            onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                            className="h-8 bg-black/60 border border-glass-border hover:border-white/20 rounded px-2 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-50"
                          >
                            {VALID_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          {updatingId === u.uid && (
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin"></span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
