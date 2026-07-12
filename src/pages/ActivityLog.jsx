import React, { useState, useEffect } from 'react';
import { activityService } from '../lib/activityService';

// Explicit mapping from actionType to filter buckets
const FILTER_MAP = {
  Alerts: ['overdue', 'discrepancy', 'error', 'maintenance_needed'],
  Approvals: ['transfer_approved', 'promotion', 'asset_approved', 'checkout_approved'],
  Bookings: ['booking_confirmed', 'booking_cancelled', 'booking_requested']
};

/**
 * Maps an actionType to one of the 4 buckets: 'Alerts', 'Approvals', 'Bookings', or default 'All'.
 * 
 * @param {string} actionType - The type of activity log action.
 * @returns {string} The matched bucket name.
 */
const getBucketForActionType = (actionType) => {
  if (FILTER_MAP.Alerts.includes(actionType)) return 'Alerts';
  if (FILTER_MAP.Approvals.includes(actionType)) return 'Approvals';
  if (FILTER_MAP.Bookings.includes(actionType)) return 'Bookings';
  return 'All';
};

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const data = await activityService.listActivityLogs();
        setLogs(data);
      } catch (err) {
        setErrorMsg('Failed to load system activity logs.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  // Filter logs client-side
  const filteredLogs = logs.filter(log => {
    if (activeFilter === 'All') return true;
    return getBucketForActionType(log.actionType) === activeFilter;
  });

  // Dynamic empty state message
  const getEmptyStateMessage = () => {
    switch (activeFilter) {
      case 'Alerts':
        return 'No alerts yet';
      case 'Approvals':
        return 'No approvals yet';
      case 'Bookings':
        return 'No bookings yet';
      default:
        return 'No activity yet';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Error banner */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-900 text-red-200 px-4 py-3 rounded-lg text-xs">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Filter Toggle Buttons Header */}
      <div className="flex border-b border-stone-850">
        {['All', 'Alerts', 'Approvals', 'Bookings'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeFilter === filter
                ? 'border-asset-green text-asset-light bg-stone-950/20'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Activity Feed Container */}
      <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 border-b border-stone-850 pb-3">
          Activity Ledger Feed [{activeFilter}]
        </h3>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center py-2.5 border-b border-stone-850/50">
                <div className="h-2 w-2 rounded-full bg-stone-900"></div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-stone-900 rounded animate-pulse w-2/3"></div>
                </div>
                <div className="h-3 bg-stone-900 rounded animate-pulse w-12"></div>
              </div>
            ))}
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="divide-y divide-stone-850/55">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="py-3.5 flex items-center justify-between text-xs hover:bg-stone-900/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Visual bullet matching bucket type */}
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    getBucketForActionType(log.actionType) === 'Alerts' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                    getBucketForActionType(log.actionType) === 'Approvals' ? 'bg-amber-500' :
                    getBucketForActionType(log.actionType) === 'Bookings' ? 'bg-emerald-500' :
                    'bg-stone-500'
                  }`}></span>
                  
                  <p className="text-stone-300">
                    <span className="font-semibold text-asset-light">{log.personName}</span>
                    {' '}
                    <span className="text-stone-400">{log.action}</span>
                    {' '}
                    <span className="font-medium text-asset-light">{log.assetName || log.resource}</span>
                    {' - '}
                    <span className="text-stone-500 font-mono">{log.deptName || log.detail}</span>
                  </p>
                </div>
                <span className="text-stone-600 font-mono text-[10px] uppercase tracking-wide">
                  {log.timestampRelative || 'Just now'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-stone-500 font-mono uppercase italic tracking-wide">
            {getEmptyStateMessage()}
          </div>
        )}
      </div>
    </div>
  );
}
