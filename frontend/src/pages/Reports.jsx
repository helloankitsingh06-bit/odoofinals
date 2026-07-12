import React, { useState, useEffect } from 'react';
import { reportsService } from '../lib/reportsService';
import StatusBadge from '../components/StatusBadge';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [utilizationData, setUtilizationData] = useState([]);
  const [maintenanceFreq, setMaintenanceFreq] = useState([]);
  const [mostUsed, setMostUsed] = useState([]);
  const [idleAssets, setIdleAssets] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const [util, freq, active, idle, alerts] = await Promise.all([
          reportsService.getUtilizationByDept(),
          reportsService.getMaintenanceFrequency(),
          reportsService.getMostUsedAssets(),
          reportsService.getIdleAssets(),
          reportsService.getUpcomingMaintenanceAlerts()
        ]);
        setUtilizationData(util);
        setMaintenanceFreq(freq);
        setMostUsed(active);
        setIdleAssets(idle);
        setMaintenanceAlerts(alerts);
      } catch (err) {
        console.error('Error fetching analytics reports:', err);
        setErrorMsg('Failed to compile registry reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const handleExportReport = () => {
    // TODO: generate CSV/PDF export from real data
    console.log('Export report clicked - stub handler');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <span className="h-8 w-8 rounded-full border-4 border-stone-800/40 border-t-emerald-500 animate-spin"></span>
        <p className="text-sm text-stone-500 font-mono">COMPILING SYSTEM METRICS...</p>
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

      {/* Top Title/Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-asset-light">Reports & Analytics</h2>
          <p className="text-xs text-stone-500 font-mono mt-0.5">SYSTEM-WIDE UTILIZATION AND MAINTENANCE AUDITING</p>
        </div>
        <button
          onClick={handleExportReport}
          className="h-10 px-4 bg-asset-green/35 border border-emerald-500/25 hover:bg-asset-green/45 hover:border-emerald-500/40 text-asset-light rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-green-glow flex items-center justify-center gap-1.5 self-start md:self-auto"
        >
          <span>Export Report</span>
        </button>
      </div>

      {/* Charting Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Utilization by Department */}
        <div className="glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-glass-border pb-3">
            Utilization by Department
          </h3>
          {utilizationData.length > 0 ? (
            <div className="space-y-4">
              {utilizationData.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-stone-300">{item.department}</span>
                    <span className="text-asset-light font-mono">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-glass-border">
                    <div
                      className="h-full bg-emerald-500 shadow-accent-glow rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-white/[0.02] border border-glass-border flex items-center justify-center mb-1">
                <span className="text-stone-500 text-lg">📊</span>
              </div>
              <p className="text-xs text-stone-500 font-mono uppercase italic tracking-wide">No data yet</p>
              <p className="text-[10px] text-stone-600">Departmental asset utilization figures are compiling.</p>
            </div>
          )}
        </div>

        {/* Card 2: Maintenance Frequency Chart */}
        <div className="glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-glass-border pb-3">
            Maintenance Frequency Chart
          </h3>
          {maintenanceFreq.length > 0 ? (
            <div className="h-48 flex items-end gap-2 pt-4">
              {maintenanceFreq.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full bg-emerald-500/30 hover:bg-emerald-550/45 rounded-t border-t border-x border-emerald-500/20 shadow-green-glow transition-colors" style={{ height: `${(item.count / 20) * 100}%` }}></div>
                  <span className="text-[10px] text-stone-500 font-mono rotate-45 origin-left whitespace-nowrap">{item.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-white/[0.02] border border-glass-border flex items-center justify-center mb-1">
                <span className="text-stone-500 text-lg">📈</span>
              </div>
              <p className="text-xs text-stone-500 font-mono uppercase italic tracking-wide">No data yet</p>
              <p className="text-[10px] text-stone-600">Maintenance events and frequency tracking is compiling.</p>
            </div>
          )}
        </div>
      </div>

      {/* Asset Usage Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 3: Most Used Assets */}
        <div className="glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-glass-border pb-3">
            Most Used Assets
          </h3>
          {mostUsed.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-glass-border text-stone-400 uppercase tracking-widest text-[10px]">
                    <th className="py-3 px-4 font-bold align-middle">Asset</th>
                    <th className="py-3 px-4 font-bold align-middle">Bookings</th>
                    <th className="py-3 px-4 font-bold text-right align-middle">Usage Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {mostUsed.map((asset) => (
                    <tr key={asset.id} className="border-b border-glass-border/40 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-asset-light align-middle">
                        {asset.name} <span className="text-stone-500 font-mono">({asset.code})</span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-400 font-mono align-middle">{asset.bookingsCount}</td>
                      <td className="py-3.5 px-4 text-right text-stone-400 font-mono align-middle">{asset.hoursUsed} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-white/[0.02] border border-glass-border flex items-center justify-center mb-1">
                <span className="text-stone-500 text-lg">⏳</span>
              </div>
              <p className="text-xs text-stone-500 font-mono uppercase italic tracking-wide">No usage data yet</p>
              <p className="text-[10px] text-stone-600">Compilation requires active allocation history.</p>
            </div>
          )}
        </div>

        {/* Card 4: Idle Assets List */}
        <div className="glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-glass-border pb-3">
            Idle Assets Registry
          </h3>
          {idleAssets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-glass-border text-stone-400 uppercase tracking-widest text-[10px]">
                    <th className="py-3 px-4 font-bold align-middle">Asset</th>
                    <th className="py-3 px-4 font-bold text-right align-middle">Days Idle</th>
                  </tr>
                </thead>
                <tbody>
                  {idleAssets.map((asset) => (
                    <tr key={asset.id} className="border-b border-glass-border/40 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-asset-light align-middle">
                        {asset.name} <span className="text-stone-500 font-mono">({asset.code})</span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-stone-400 font-mono align-middle">{asset.idleDays} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-white/[0.02] border border-glass-border flex items-center justify-center mb-1">
                <span className="text-stone-500 text-lg">💤</span>
              </div>
              <p className="text-xs text-stone-500 font-mono uppercase italic tracking-wide">No usage data yet</p>
              <p className="text-[10px] text-stone-600">All registered assets are currently allocated.</p>
            </div>
          )}
        </div>
      </div>

      {/* Card 5: Upcoming Maintenance / Nearing Retirement Alerts */}
      <div className="glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-glass-border pb-3">
          Upcoming Maintenance & Retirement Alerts
        </h3>
        {maintenanceAlerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-glass-border text-stone-400 uppercase tracking-widest text-[10px]">
                  <th className="py-3 px-4 font-bold align-middle">Asset</th>
                  <th className="py-3 px-4 font-bold align-middle">Alert Type</th>
                  <th className="py-3 px-4 font-bold text-right align-middle">Target Date</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceAlerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-glass-border/40 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-asset-light align-middle">
                      {alert.name} <span className="text-stone-500 font-mono">({alert.code})</span>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase font-mono tracking-wider border ${
                        alert.alertType === 'Retirement'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                          : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.1)]'
                      }`}>
                        {alert.alertType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-stone-400 font-mono align-middle">{alert.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-white/[0.02] border border-glass-border flex items-center justify-center mb-1">
              <span className="text-stone-500 text-lg">🛡️</span>
            </div>
            <p className="text-xs text-stone-500 font-mono uppercase italic tracking-wide">Nothing due right now</p>
            <p className="text-[10px] text-stone-600">All assets are compliant with active maintenance cycles.</p>
          </div>
        )}
      </div>
    </div>
  );
}
