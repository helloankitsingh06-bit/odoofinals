import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assetService } from '../lib/assetService';
import { orgService } from '../lib/orgService';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [kpiCounts, setKpiCounts] = useState({
    available: 0,
    allocated: 0,
    underMaintenance: 0,
    activeBookings: 0,
    pendingTransfers: 0,
    upcomingReturns: 0
  });
  const [overdueReturns, setOverdueReturns] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const [kpiData, overdueData, activityData] = await Promise.all([
          assetService.getKpiCounts(),
          assetService.getOverdueReturns(),
          orgService.getRecentActivity(3)
        ]);
        setKpiCounts(kpiData);
        setOverdueReturns(overdueData);
        setRecentActivity(activityData);
      } catch (err) {
        setErrorMsg('Error reloading dashboard statistics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Quick action configs
  const quickActions = [
    { label: '+ Register asset', path: '/assets', color: 'hover:border-stone-500 hover:text-asset-light' },
    { label: 'Book resource', path: '/resource-booking', color: 'hover:border-stone-500 hover:text-asset-light' },
    { label: 'Raise request', path: '/maintenance', color: 'hover:border-stone-500 hover:text-asset-light' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Error banner */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-900 text-red-200 px-4 py-3 rounded-lg text-xs">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">
          Core Metrics Registry
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(kpiCounts).map(([key, value]) => {
            // Convert camelCase key to uppercase space-separated label
            const label = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase());

            return (
              <div
                key={key}
                className="bg-stone-950 border border-stone-850 p-5 rounded-lg flex flex-col justify-between min-h-[110px]"
              >
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  {label}
                </span>
                {loading ? (
                  <div className="h-8 w-12 bg-stone-900 rounded animate-pulse mt-2"></div>
                ) : (
                  <span className="text-3xl font-light text-asset-light tracking-tight mt-2 font-mono">
                    {value}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Overdue Returns Box */}
      <div className="bg-stone-950 border border-red-950/60 p-6 rounded-lg">
        <div className="flex items-center gap-2 border-b border-red-950/40 pb-3 mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
          <h3 className="text-xs font-bold uppercase tracking-widest text-red-400">
            Overdue Returns Alert
          </h3>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-5 bg-stone-900 rounded animate-pulse w-2/3"></div>
            <div className="h-5 bg-stone-900 rounded animate-pulse w-1/2"></div>
          </div>
        ) : overdueReturns.length > 0 ? (
          <div className="divide-y divide-red-950/20">
            {overdueReturns.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs text-red-200">
                <span>{item.assetName} ({item.assetCode})</span>
                <span className="font-semibold text-[10px] bg-red-950 text-red-400 border border-red-900/40 px-2 py-0.5 rounded uppercase">
                  Overdue {item.daysOverdue} days
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2 text-xs text-stone-500 font-mono uppercase italic tracking-wide">
            No overdue returns
          </div>
        )}
      </div>

      {/* Lower Dashboard Grid (Quick Actions & Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Actions Panel */}
        <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 border-b border-stone-850 pb-3">
            Quick Actions Panel
          </h3>
          
          <div className="flex flex-col gap-2.5">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.path}
                className={`w-full text-left px-4 py-3 border border-stone-850 bg-stone-900/10 rounded text-xs text-stone-400 font-semibold tracking-wider transition-all duration-150 uppercase ${action.color}`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Mini-Feed */}
        <div className="lg:col-span-2 bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 border-b border-stone-850 pb-3">
            Recent activity logs (Top 3)
          </h3>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="h-2 w-2 rounded-full bg-stone-900"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-stone-900 rounded animate-pulse w-3/4"></div>
                    <div className="h-2.5 bg-stone-900 rounded animate-pulse w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3 items-center text-xs py-1">
                  <span className="h-1 w-1 rounded-full bg-asset-green"></span>
                  <p className="text-stone-300">
                    <span className="font-semibold text-asset-light">{activity.assetName}</span>
                    {' - '}
                    <span className="text-stone-400">{activity.action} to </span>
                    <span className="font-medium text-asset-light">{activity.personName}</span>
                    {' - '}
                    <span className="text-stone-500 font-mono">[{activity.deptName}]</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-xs text-stone-500 font-mono uppercase italic tracking-wide">
              No recent activity yet
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
