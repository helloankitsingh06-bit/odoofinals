import React, { useState, useEffect } from 'react';
import { notificationService } from '../lib/notificationService';
import StatusBadge from '../components/StatusBadge';

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const data = await notificationService.listNotifications();
        setNotifications(data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setErrorMsg('Failed to load system notifications.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = () => {
    // TODO: update all user notifications to read: true
    console.log('Mark all as read clicked - stub handler');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <span className="h-8 w-8 rounded-full border-4 border-stone-800/40 border-t-emerald-500 animate-spin"></span>
        <p className="text-sm text-stone-500 font-mono">RETRIEVING NOTIFICATIONS...</p>
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
          <h2 className="text-xl font-bold uppercase tracking-wider text-asset-light">Notifications</h2>
          <p className="text-xs text-stone-500 font-mono mt-0.5">REAL-TIME SYSTEM ALERTS AND ACTIONS</p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          className="h-10 px-4 bg-white/[0.02] border border-glass-border hover:bg-white/5 hover:border-white/20 text-stone-300 font-bold text-xs uppercase rounded-md tracking-wider transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:shadow-green-glow flex items-center justify-center self-start md:self-auto"
        >
          Mark all as read
        </button>
      </div>

      {/* Notification Ledger Box */}
      <div className="glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-glass-border pb-3">
          Inbox Notification Feed
        </h3>

        {notifications.length > 0 ? (
          <div className="divide-y divide-glass-border/40">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`py-4 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors ${
                  !notif.read ? 'bg-white/[0.01]' : 'bg-transparent opacity-75'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Unread indicator dot */}
                  <div className="pt-1.5 flex-shrink-0">
                    <span
                      className={`h-2 w-2 rounded-full block ${
                        !notif.read ? 'bg-emerald-500 shadow-accent-glow animate-pulse' : 'bg-stone-800'
                      }`}
                    ></span>
                  </div>
                  
                  {/* Message & Meta */}
                  <div className="space-y-0.5">
                    <p className="text-xs text-stone-200 font-medium">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-stone-500 font-mono">
                      {notif.timestampRelative || 'Just now'}
                    </p>
                  </div>
                </div>

                {/* Badge Type indicator */}
                <div className="flex-shrink-0">
                  <StatusBadge status={notif.type} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-white/[0.02] border border-glass-border flex items-center justify-center mb-2">
              <span className="text-stone-500 text-lg">🔔</span>
            </div>
            <p className="text-xs text-stone-500 font-mono uppercase italic tracking-wide">
              No notifications yet
            </p>
            <p className="text-[11px] text-stone-600">
              You are completely caught up. Incoming alerts and approvals will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
