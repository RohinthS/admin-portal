import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PermissionTable, ModulePermission } from '../components/PermissionTable';
import { ShieldCheck, Building, Save, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const RolesPermissionsPage: React.FC = () => {
  const { companies, activeCompanyId } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(activeCompanyId || '');
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/roles');
        setRoles(res.data || []);
        if (res.data?.length > 0) {
          setSelectedRoleId(res.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load roles', err);
      }
    };
    fetchRoles();
  }, []);

  // Load role permissions when role or company changes
  useEffect(() => {
    if (!selectedRoleId || !selectedCompanyId) return;

    const fetchPermissions = async () => {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      try {
        const res = await api.get(`/roles/${selectedRoleId}/permissions`, {
          params: { company_id: selectedCompanyId },
        });
        setPermissions(res.data?.modules || []);
      } catch (err: any) {
        setErrorMsg('Failed to load role permissions');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [selectedRoleId, selectedCompanyId]);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        company_id: selectedCompanyId,
        permissions: permissions.map((p) => ({
          page: p.key,
          actions: p.actions,
        })),
      };

      await api.post(`/roles/${selectedRoleId}/permissions`, payload);
      setSuccessMsg('Permissions matrix saved successfully!');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Role-Based Access Control (RBAC)</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure granular page-level permissions (Add, Edit, View, Delete) per company branch
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading || !selectedRoleId}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Matrix...' : 'Save Permissions'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 rounded-xl">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="p-4 glass-card rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Select System Role</span>
          </label>
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            {roles.map((r) => (
              <option key={r._id} value={r._id}>
                {r.role_name} ({r.role_title || 'General'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-indigo-500" />
            <span>Target Company Branch</span>
          </label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            {companies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.branch} ({c.company_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="p-5 sm:p-6 glass-card rounded-2xl">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <PermissionTable
            permissions={permissions}
            onChange={setPermissions}
            disabled={saving}
          />
        )}
      </div>
    </div>
  );
};
