import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { bookingService } from '../lib/bookingService';

/**
 * ResourceBooking page provides resource calendar viewing,
 * time-slot booking with overlap collision warning, and cancellation.
 */
export default function ResourceBooking() {
  const { user } = useAuth();

  // Initial load states
  const [resources, setResources] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [initialError, setInitialError] = useState(null);

  // Picker states
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Booking schedule states
  const [bookings, setBookings] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);

  // Form states
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [purpose, setPurpose] = useState('');
  const [formValidationError, setFormValidationError] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Global action state (e.g. booking creation or cancellation in progress)
  const [actionPending, setActionPending] = useState(false);
  const [actionToast, setActionToast] = useState(null); // { type: 'success' | 'error', message: '' }

  // Load resource options on mount
  useEffect(() => {
    async function loadResources() {
      try {
        setLoadingInitial(true);
        const list = await bookingService.listBookableResources();
        setResources(list);
        if (list.length > 0) {
          setSelectedResourceId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load bookable resources:', err);
        setInitialError('Failed to load bookable resources.');
      } finally {
        setLoadingInitial(false);
      }
    }
    loadResources();
  }, []);

  // Fetch resource schedule whenever selected resource or date changes
  const fetchSchedule = async () => {
    if (!selectedResourceId || !selectedDate) {
      setBookings([]);
      return;
    }

    setLoadingSchedule(true);
    setScheduleError(null);
    try {
      const list = await bookingService.listBookings(selectedResourceId, selectedDate);
      setBookings(list);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setScheduleError('Failed to load resource schedule.');
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [selectedResourceId, selectedDate]);

  // Form submission handler
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setFormValidationError('');
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!selectedResourceId) {
      setFormValidationError('No resource selected');
      return;
    }
    if (!startTime || !endTime) {
      setFormValidationError('Start time and end time are required');
      return;
    }
    if (startTime >= endTime) {
      setFormValidationError('Start time must be before end time');
      return;
    }
    if (!purpose || !purpose.trim()) {
      setFormValidationError('Purpose is required');
      return;
    }

    const resource = resources.find(r => r.id === selectedResourceId);
    const resourceName = resource ? resource.name : 'Resource';

    setActionPending(true);
    try {
      await bookingService.createBooking({
        resourceId: selectedResourceId,
        resourceName,
        bookedByUserId: user?.uid || 'mock-user-id',
        bookedByName: user?.name || user?.email || 'Mock User',
        date: selectedDate,
        startTime,
        endTime,
        purpose: purpose.trim()
      });

      // Reset form fields
      setPurpose('');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);

      // Refresh listing
      await fetchSchedule();
    } catch (err) {
      // Overlap detection throws go directly to this banner block
      setSubmitError(err.message || 'Failed to reserve slot');
    } finally {
      setActionPending(false);
    }
  };

  // Cancellation handler
  const handleCancelBooking = async (bookingId) => {
    setActionPending(true);
    setActionToast(null);
    try {
      await bookingService.cancelBooking(bookingId);
      setActionToast({ type: 'success', message: 'Booking cancelled successfully.' });
      setTimeout(() => setActionToast(null), 4000);
      await fetchSchedule();
    } catch (err) {
      setActionToast({ type: 'error', message: err.message || 'Failed to cancel booking' });
      setTimeout(() => setActionToast(null), 5000);
    } finally {
      setActionPending(false);
    }
  };

  const getSelectedResourceName = () => {
    const res = resources.find(r => r.id === selectedResourceId);
    return res ? res.name : '';
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold uppercase tracking-wider text-asset-light">Resource Booking</h2>
        <p className="text-xs text-stone-500 font-mono mt-0.5">RESERVE WORKSPACES AND SHARED EQUIPMENT</p>
      </div>

      {/* Global Toast */}
      {initialError && (
        <div className="bg-red-950/80 border border-red-900 text-red-200 px-4 py-3 rounded-lg text-xs font-sans">
          ⚠️ {initialError}
        </div>
      )}

      {actionToast && (
        <div className={`border px-4 py-3 rounded-lg flex items-center justify-between text-xs transition-all animate-fadeIn ${
          actionToast.type === 'success' 
            ? 'bg-stone-900 border-asset-green text-asset-light' 
            : 'bg-red-950/80 border-red-900 text-red-200'
        }`}>
          <span className="flex items-center gap-2">
            {actionToast.type === 'success' && <span className="h-1.5 w-1.5 rounded-full bg-asset-green"></span>}
            {actionToast.message}
          </span>
          <button onClick={() => setActionToast(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Selector Panel */}
      <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-6 shadow-md">
        {/* Resource Picker */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
            Resource / Asset *
          </label>
          {loadingInitial ? (
            <div className="text-stone-500 text-xs font-mono">LOADING RESOURCES...</div>
          ) : resources.length === 0 ? (
            <div className="text-amber-500 text-xs font-mono border border-amber-900/50 bg-amber-950/20 px-3 py-2 rounded">
              No bookable resources configured. Please register a bookable asset first.
            </div>
          ) : (
            <select
              value={selectedResourceId}
              onChange={(e) => {
                setSelectedResourceId(e.target.value);
                setSubmitError(null);
                setSubmitSuccess(false);
              }}
              className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
            >
              {resources.map((res) => (
                <option key={res.id} value={res.id}>
                  {res.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Date Picker */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
            Date *
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSubmitError(null);
              setSubmitSuccess(false);
            }}
            className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
          />
        </div>
      </div>

      {/* Main Schedule Workspace */}
      {selectedResourceId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* List of Existing Bookings (col-span-2) */}
          <div className="lg:col-span-2 bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-4 shadow-md">
            <h3 className="text-sm font-bold uppercase tracking-wider text-asset-light">
              Existing Schedule: {getSelectedResourceName()} ({selectedDate})
            </h3>
            
            {loadingSchedule ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <span className="h-6 w-6 rounded-full border-2 border-stone-800 border-t-asset-green animate-spin"></span>
                <p className="text-[10px] text-stone-500 font-mono tracking-wider uppercase">Loading schedule...</p>
              </div>
            ) : scheduleError ? (
              <div className="bg-red-950/80 border border-red-900 text-red-200 px-4 py-3 rounded text-xs">
                ⚠️ {scheduleError}
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed border-stone-850 rounded-lg p-6">
                <p className="text-xs text-stone-500 font-mono uppercase">No reservations booked on this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => {
                  let badgeClass = "p-4 rounded border text-xs flex justify-between items-center transition-all ";
                  if (booking.status === 'Upcoming') {
                    badgeClass += "bg-asset-green/10 text-emerald-400 border-asset-green/20";
                  } else if (booking.status === 'Ongoing') {
                    badgeClass += "bg-sky-500/10 text-sky-400 border-sky-500/20";
                  } else if (booking.status === 'Completed') {
                    badgeClass += "bg-stone-900/60 text-stone-400 border-stone-850";
                  } else if (booking.status === 'Cancelled') {
                    badgeClass += "bg-red-950/10 text-red-500 border-red-950/20 line-through opacity-50";
                  }

                  return (
                    <div key={booking.id} className={badgeClass}>
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-sm tracking-wide">
                          {booking.startTime} – {booking.endTime}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          Booker: <strong className="text-stone-300">{booking.bookedByName}</strong>
                        </div>
                        <div className="text-[10px] text-stone-500 italic mt-1 font-mono">
                          "{booking.purpose}"
                        </div>
                      </div>
                      
                      {/* Cancel Button */}
                      {(booking.status === 'Upcoming' || booking.status === 'Ongoing') && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={actionPending}
                          className="bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/50 px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-colors disabled:opacity-50 shrink-0"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Book a Slot Form (col-span-1) */}
          <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-4 shadow-md self-start">
            <h3 className="text-sm font-bold uppercase tracking-wider text-asset-light">Book a Slot</h3>
            
            {submitError && (
              <div className="bg-red-950/80 border border-red-900 text-red-200 p-4 rounded text-xs leading-relaxed animate-fadeIn">
                <strong>⚠️ Booking Conflict:</strong>
                <p className="mt-1 font-mono text-[10px] leading-relaxed">{submitError}</p>
              </div>
            )}

            {submitSuccess && (
              <div className="bg-stone-900 border border-asset-green text-asset-light px-4 py-3 rounded text-xs flex items-center gap-2 animate-fadeIn">
                <span className="h-1.5 w-1.5 rounded-full bg-asset-green animate-ping"></span>
                <span>Booking slot reserved successfully!</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {/* Start/End Time Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setSubmitError(null);
                    }}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setSubmitError(null);
                    }}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Purpose Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Purpose of Booking *
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    setSubmitError(null);
                  }}
                  placeholder="e.g. Project Scrum Sync"
                  className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
                  required
                />
                {formValidationError && <p className="text-[10px] text-red-500 mt-1">{formValidationError}</p>}
              </div>

              <button
                type="submit"
                disabled={actionPending || !selectedResourceId}
                className="w-full bg-asset-green hover:bg-opacity-90 text-asset-light rounded py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {actionPending ? 'Processing…' : 'Reserve Time Slot'}
              </button>
            </form>
          </div>

        </div>
      ) : (
        <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg text-center text-xs text-stone-400 space-y-3">
          <p>No bookable resources or shared assets are currently configured in the ERP registry.</p>
          <p className="text-stone-500 text-[10px] font-mono">TIP: REGISTER AN ASSET UNDER "ASSETS" AND CHECK "MARK AS SHARED / BOOKABLE RESOURCE"</p>
        </div>
      )}
    </div>
  );
}
