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
        <span className="h-8 w-8 rounded-full border-4 border-stone-800 border-t-asset-green animate-spin"></span>
        <p className="text-sm text-stone-500 font-mono">LOADING AUDIT CYCLE...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Error banner */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-900 text-red-200 px-4 py-3 rounded-lg text-xs">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Header Panel: Current Audit Cycle */}
      <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg">
        {auditCycle ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase font-mono tracking-wider bg-asset-green/10 text-emerald-400 border border-asset-green/30">
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
              className="h-10 px-4 bg-red-900/10 hover:bg-red-900/20 text-red-400 border border-red-900/30 font-bold text-xs uppercase rounded-md tracking-wider transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-900/50 flex items-center justify-center self-start md:self-auto"
            >
              Close Audit Cycle
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
            <div className="space-y-1">
              <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase font-mono tracking-wider bg-stone-900 text-stone-500 border border-stone-800">
                Inactive
              </span>
              <h2 className="text-sm font-bold text-asset-light uppercase tracking-wider mt-1.5">
                No active audit cycle
              </h2>
              <p className="text-xs text-stone-500">
                Please configure or start a physical audit cycle to begin reconciliation.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Discrepancy Summary Bar */}
      {discrepancyCount > 0 && (
        <div className="bg-red-950/20 border border-red-900/40 p-4 rounded-md flex items-center gap-2 text-xs text-red-200">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
          <span>
            Discrepancy Warning: <strong className="font-semibold font-mono">{discrepancyCount}</strong> asset{discrepancyCount > 1 ? 's' : ''} flagged with missing or damaged verification status.
          </span>
        </div>
      )}

      {/* Checklist Table Card */}
      <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-850 pb-3">
          Physical Verification Checklist
        </h3>

        {auditItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-850 text-stone-400 uppercase tracking-widest text-[10px]">
                  <th className="py-3.5 px-4 font-bold align-middle">Asset Name</th>
                  <th className="py-3.5 px-4 font-bold align-middle">Expected Location</th>
                  <th className="py-3.5 px-4 font-bold text-center align-middle">Verification Status</th>
                </tr>
              </thead>
              <tbody>
                {auditItems.map((item) => (
                  <tr key={item.id} className="border-b border-stone-850 hover:bg-stone-900/20 transition-colors">
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
          <div className="py-12 text-center space-y-2">
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
