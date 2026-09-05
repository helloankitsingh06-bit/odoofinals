import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { workingScheduleService } from '../lib/workingScheduleService';
import { SCHEDULE_TYPES, VALID_SCHEDULE_TYPES, DAYS_OF_WEEK } from '../constants';
import { useAuth } from '../hooks/useAuth';

const DEFAULT_DAYS = DAYS_OF_WEEK.map((day) => ({
  day,
  isWorking: !['Saturday', 'Sunday'].includes(day),
  startTime: !['Saturday', 'Sunday'].includes(day) ? '09:00' : '',
  endTime: !['Saturday', 'Sunday'].includes(day) ? '17:00' : '',
  breakMins: !['Saturday', 'Sunday'].includes(day) ? 60 : 0,
}));

export default function WorkingSchedules() {
  const { user } = useAuth();
  const isPayrollOrAdmin = ['Admin', 'HRPayrollUser', 'HRPayrollManager'].includes(
    user?.role
  );

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState(SCHEDULE_TYPES.FIXED);
  const [patternDays, setPatternDays] = useState(DEFAULT_DAYS);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchSchedules = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await workingScheduleService.list();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err.message || 'Failed to load working schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Live client-side calculation of total weekly hours
  const liveWeeklyHours = useMemo(() => {
    let totalMinutes = 0;
    for (const d of patternDays) {
      if (!d.isWorking || !d.startTime || !d.endTime) continue;
      const [sh, sm] = d.startTime.split(':').map((v) => parseInt(v, 10) || 0);
      const [eh, em] = d.endTime.split(':').map((v) => parseInt(v, 10) || 0);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      const duration = endMin - startMin;
      const breakMins = parseInt(d.breakMins, 10) || 0;

      if (duration > 0 && duration >= breakMins) {
        totalMinutes += duration - breakMins;
      }
    }
    return +(totalMinutes / 60).toFixed(2);
  }, [patternDays]);

  const handleOpenModal = (schedule = null) => {
    setFormError('');
    if (schedule) {
      setEditingSchedule(schedule);
      setName(schedule.name || '');
      setType(schedule.type || SCHEDULE_TYPES.FIXED);

      // Reconstruct 7 days
      const map = {};
      (schedule.weeklyPattern || []).forEach((p) => {
        map[p.day] = p;
      });

      const hydrated = DAYS_OF_WEEK.map((day) => {
        const found = map[day];
        return {
          day,
          isWorking: Boolean(found && found.startTime && found.endTime),
          startTime: (found && found.startTime) || '09:00',
          endTime: (found && found.endTime) || '17:00',
          breakMins: found ? found.breakMins : 60,
        };
      });
      setPatternDays(hydrated);
    } else {
      setEditingSchedule(null);
      setName('');
      setType(SCHEDULE_TYPES.FIXED);
      setPatternDays(DEFAULT_DAYS);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
    setFormError('');
  };

  const handleDayChange = (index, field, value) => {
    setPatternDays((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Schedule name is required');
      return;
    }

    // Build pattern array matching schema { day, startTime, endTime, breakMins }
    const weeklyPattern = patternDays
      .filter((d) => d.isWorking)
      .map((d) => ({
        day: d.day,
        startTime: d.startTime,
        endTime: d.endTime,
        breakMins: parseInt(d.breakMins, 10) || 0,
      }));

    if (weeklyPattern.length === 0) {
      setFormError('Please enable at least one working day in the weekly pattern.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        weeklyPattern,
      };

      if (editingSchedule) {
        await workingScheduleService.update(editingSchedule.id, payload);
        setSuccessMsg(`Working schedule "${name}" updated.`);
      } else {
        await workingScheduleService.create(payload);
        setSuccessMsg(`Working schedule "${name}" created.`);
      }
      handleCloseModal();
      await fetchSchedules();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Failed to save working schedule.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (schedule) => {
    if (!window.confirm(`Delete working schedule "${schedule.name}"?`)) return;
    try {
      await workingScheduleService.remove(schedule.id);
      setSuccessMsg(`Working schedule "${schedule.name}" deleted.`);
      await fetchSchedules();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to delete schedule.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-asset-light uppercase flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-emerald-400" />
            Working Schedule Setup
          </h2>
          <p className="text-xs text-stone-400 font-mono mt-1">
            Configure shift templates & weekly patterns with auto-computed total hours
          </p>
        </div>

        {isPayrollOrAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-[#1e3427]/90 hover:bg-[#254231] text-[#76c893] border border-[#2d523c] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-accent-glow"
          >
            <Plus className="h-4 w-4" />
            New Schedule
          </button>
        )}
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

      {/* Schedules Cards Grid */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-3 glass-panel">
          <div className="h-8 w-8 rounded-full border-2 border-stone-800 border-t-emerald-500 animate-spin"></div>
          <p className="text-xs text-stone-400 font-mono">Loading working schedules...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="p-12 text-center glass-panel">
          <Clock className="h-10 w-10 text-stone-600 mx-auto mb-3" />
          <p className="text-sm text-stone-400 font-medium">No working schedules found.</p>
          <p className="text-xs text-stone-600 font-mono mt-1">
            Click "New Schedule" to create a standard working shift template.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="glass-panel p-5 border border-glass-border hover:border-emerald-500/30 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div>
                {/* Title & Type Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-asset-light">{schedule.name}</h3>
                    <span className="text-[10px] text-stone-500 font-mono">
                      ID: {schedule.id.substring(0, 8)}...
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-white/5 text-emerald-400 border border-emerald-500/20">
                    {schedule.type || 'Fixed'}
                  </span>
                </div>

                {/* Total Weekly Hours Badge */}
                <div className="mt-4 p-3 rounded-lg bg-black/40 border border-glass-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span>Computed Weekly Hours</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                    {schedule.totalWeeklyHours} hrs
                  </span>
                </div>

                {/* Weekly Pattern Breakdown */}
                <div className="mt-4 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono block">
                    Weekly Pattern ({schedule.weeklyPattern?.length || 0} working days)
                  </span>
                  <div className="space-y-1">
                    {(schedule.weeklyPattern || []).map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white/[0.02] border border-glass-border/40 font-mono"
                      >
                        <span className="text-stone-300 font-semibold">{entry.day.substring(0, 3)}</span>
                        <span className="text-stone-400 text-[11px]">
                          {entry.startTime} – {entry.endTime}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {entry.breakMins}m break
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              {isPayrollOrAdmin && (
                <div className="pt-3 border-t border-glass-border flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenModal(schedule)}
                    className="p-1.5 rounded text-stone-400 hover:text-emerald-400 hover:bg-white/5 transition-colors"
                    title="Edit Schedule"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(schedule)}
                    className="p-1.5 rounded text-stone-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                    title="Delete Schedule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ==================== CREATE / EDIT MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glass-panel p-6 border border-glass-border shadow-glass-glow rounded-xl space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-glass-border">
              <h3 className="text-base font-bold uppercase tracking-wider text-asset-light flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                {editingSchedule ? 'Edit Working Schedule' : 'New Working Schedule'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-stone-400 hover:text-stone-200 rounded-md hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-950/30 border border-red-800/40 text-red-300 px-4 py-2.5 rounded-md text-xs font-mono">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-5">
              {/* Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                    Schedule Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Standard 40hr Week"
                    className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                    Schedule Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    {VALID_SCHEDULE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Hours Summary Banner */}
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-300 font-mono">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <span>Live Computed Weekly Hours:</span>
                </div>
                <span className="text-base font-bold font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                  {liveWeeklyHours} hrs / week
                </span>
              </div>

              {/* 7-Day Pattern Builder */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                  Weekly Pattern (7 Days)
                </label>

                <div className="space-y-2">
                  {patternDays.map((dayObj, index) => (
                    <div
                      key={dayObj.day}
                      className={`p-3 rounded-lg border transition-all flex flex-wrap items-center justify-between gap-3 ${
                        dayObj.isWorking
                          ? 'bg-black/40 border-glass-border'
                          : 'bg-stone-950/30 border-stone-900/60 opacity-60'
                      }`}
                    >
                      {/* Day Name & Toggle */}
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <input
                          type="checkbox"
                          id={`working-${dayObj.day}`}
                          checked={dayObj.isWorking}
                          onChange={(e) =>
                            handleDayChange(index, 'isWorking', e.target.checked)
                          }
                          className="rounded border-glass-border bg-black text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                        <label
                          htmlFor={`working-${dayObj.day}`}
                          className={`text-xs font-bold cursor-pointer select-none ${
                            dayObj.isWorking ? 'text-asset-light' : 'text-stone-500'
                          }`}
                        >
                          {dayObj.day}
                        </label>
                      </div>

                      {/* Inputs if working */}
                      {dayObj.isWorking ? (
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Start Time */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-stone-500 font-mono">In:</span>
                            <input
                              type="time"
                              required
                              value={dayObj.startTime}
                              onChange={(e) =>
                                handleDayChange(index, 'startTime', e.target.value)
                              }
                              className="h-8 bg-black/60 border border-glass-border rounded px-2 text-xs text-asset-light font-mono"
                            />
                          </div>

                          {/* End Time */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-stone-500 font-mono">Out:</span>
                            <input
                              type="time"
                              required
                              value={dayObj.endTime}
                              onChange={(e) =>
                                handleDayChange(index, 'endTime', e.target.value)
                              }
                              className="h-8 bg-black/60 border border-glass-border rounded px-2 text-xs text-asset-light font-mono"
                            />
                          </div>

                          {/* Break Mins */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-stone-500 font-mono">Break:</span>
                            <input
                              type="number"
                              min="0"
                              max="360"
                              step="5"
                              value={dayObj.breakMins}
                              onChange={(e) =>
                                handleDayChange(index, 'breakMins', e.target.value)
                              }
                              className="w-16 h-8 bg-black/60 border border-glass-border rounded px-2 text-xs text-asset-light font-mono"
                            />
                            <span className="text-[10px] text-stone-500 font-mono">m</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-600 font-mono italic">
                          Off / Not Working
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-glass-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-md text-xs font-semibold text-stone-400 hover:text-stone-200 hover:bg-white/5 transition-colors font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-[#1e3427]/90 hover:bg-[#254231] text-[#76c893] border border-[#2d523c] px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-accent-glow"
                >
                  {formSubmitting ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
