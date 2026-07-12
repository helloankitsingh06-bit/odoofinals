import React, { useState, useEffect } from 'react';
import { auditService } from '../lib/auditService';
import StatusBadge from '../components/StatusBadge';

export default function Audit() {
  const [loading, setLoading] = useState(true);
  const [auditCycle, setAuditCycle] = useState(null);
  const [auditItems, setAuditItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchAuditData = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const [cycle, items] = await Promise.all([
          auditService.getCurrentAuditCycle(),
          auditService.listAuditItems()
        ]);
        setAuditCycle(cycle);
        setAuditItems(items);
      } catch (err) {
        console.error('Error fetching audit data:', err);
        setErrorMsg('Failed to load audit system registry.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
  }, []);

  const handleCloseCycle = () => {
    // TODO: Connect to Firestore backend to update active cycle status to closed
    console.log('Close audit cycle clicked - stub handler');
  };

  // Compute discrepancy summary (Missing or Damaged)
  const discrepancyCount = auditItems.filter(
    (item) => item.status === 'Missing' || item.status === 'Damaged'
  ).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <span className="h-8 w-8 rounded-full border-4 border-stone-800 border-t-emerald-500 animate-spin"></span>
        <p className="text-sm text-stone-500 font-mono">LOADING AUDIT CYCLE...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Error banner */}
      {errorMsg && (
        <div className="bg-red-950/20 border border-red-900/30 text-red-200 px-4 py-3 rounded-lg text-xs backdrop-blur-md">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Header Panel: Current Audit Cycle */}
      <div className="glass-panel p-6 border border-glass-border shadow-glass-glow">
        {auditCycle ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase font-mono tracking-wider bg-white/5 text-emerald-400 border border-emerald-500/20 shadow-accent-glow">
                Active Cycle
              </span>
              <h2 className="text-lg font-bold text-asset-light uppercase tracking-wider mt-1.5">
                {auditCycle.name || 'Asset Audit Reconciliation'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs text-stone-400">
                <div>
                  <span className="font-semibold text-stone-500 uppercase text-[10px] tracking-wider block">Department</span>
                  {auditCycle.department || 'All Departments'}
                </div>
                <div>
                  <span className="font-semibold text-stone-500 uppercase text-[10px] tracking-wider block">Date Range</span>
                  {auditCycle.startDate} — {auditCycle.endDate}
                </div>
                <div>
                  <span className="font-semibold text-stone-500 uppercase text-[10px] tracking-wider block">Lead Auditor(s)</span>
                  {auditCycle.auditors || 'Unassigned'}
                </div>
              </div>
            </div>
            <button
              onClick={handleCloseCycle}
              className="h-10 px-4 bg-red-950/20 border border-red-900/30 hover:bg-red-950/35 hover:border-red-900/40 text-red-400 font-bold text-xs uppercase rounded-md tracking-wider transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-900/50 flex items-center justify-center self-start md:self-auto shadow-[0_0_8px_rgba(239,68,68,0.05)]"
            >
              Close Audit Cycle
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
            <div className="space-y-1">
              <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase font-mono tracking-wider bg-stone-900/30 text-stone-500 border border-stone-850">
                Inactive
              </span>
              <h2 className="text-sm font-bold text-asset-light uppercase tracking-wider mt-1.5">
                No active audit cycle
              </h2>
              <p className="text-xs text-stone-550">
                Please configure or start a physical audit cycle to begin reconciliation.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Discrepancy Warning Bar */}
      {discrepancyCount > 0 && (
        <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-md flex items-center gap-2 text-xs text-red-200 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
          <span>
            Discrepancy Warning: <strong className="font-semibold font-mono">{discrepancyCount}</strong> asset{discrepancyCount > 1 ? 's' : ''} flagged with missing or damaged verification status.
          </span>
        </div>
      )}

      {/* Checklist Table Card */}
      <div className="glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-glass-border pb-3">
          Physical Verification Checklist
        </h3>

        {auditItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-glass-border text-stone-400 uppercase tracking-widest text-[10px]">
                  <th className="py-3.5 px-4 font-bold align-middle">Asset Name</th>
                  <th className="py-3.5 px-4 font-bold align-middle">Expected Location</th>
                  <th className="py-3.5 px-4 font-bold text-center align-middle">Verification Status</th>
                </tr>
              </thead>
              <tbody>
                {auditItems.map((item) => (
                  <tr key={item.id} className="border-b border-glass-border/40 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-asset-light align-middle">
                      {item.assetName} <span className="text-stone-500 font-mono text-[10px]">({item.assetCode})</span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-400 align-middle">{item.expectedLocation}</td>
                    <td className="py-3.5 px-4 text-center align-middle">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-white/[0.02] border border-glass-border flex items-center justify-center mb-2">
              <span className="text-stone-500 text-lg">📋</span>
            </div>
            <p className="text-xs text-stone-500 font-mono uppercase italic tracking-wide">
              No audit items yet
            </p>
            <p className="text-[11px] text-stone-600">
              Active cycle items will populate here once loaded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
