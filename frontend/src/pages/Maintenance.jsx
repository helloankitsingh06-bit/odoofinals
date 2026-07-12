import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { assetService } from '../lib/assetService';
import { orgService } from '../lib/orgService';
import { maintenanceService } from '../lib/maintenanceService';

/**
 * Maintenance page renders the Kanban Board for maintenance request lifecycles:
 * Pending -> Approved -> Technician Assigned -> In Progress -> Resolved.
 */
export default function Maintenance() {
  const { user: currentUser } = useAuth();

  // Data states
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialError, setInitialError] = useState(null);

  // Global action toast states
  const [actionPending, setActionPending] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  // Form states
  const [raiseAssetId, setRaiseAssetId] = useState('');
  const [raiseIssue, setRaiseIssue] = useState('');
  const [raisePriority, setRaisePriority] = useState('Medium');
  const [raisePhotoNote, setRaisePhotoNote] = useState('');
  const [formValidationError, setFormValidationError] = useState('');

  // Inline inputs state holders
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const [assigningId, setAssigningId] = useState(null);
  const [techName, setTechName] = useState('');

  const [resolvingId, setResolvingId] = useState(null);
  const [resNotes, setResNotes] = useState('');

  // Fetch initial data: assets list and maintenance requests
  const fetchData = async () => {
    try {
      const [reqList, assetList] = await Promise.all([
        maintenanceService.listRequests(),
        assetService.listAssets()
      ]);
      setRequests(reqList);
      setAssets(assetList);
    } catch (err) {
      console.error('Failed to load maintenance workspace:', err);
      setInitialError('Failed to load maintenance workspace.');
    }
  };

  useEffect(() => {
    async function loadWorkspace() {
      setLoading(true);
      await fetchData();
      setLoading(false);
    }
    loadWorkspace();
  }, []);

  const triggerToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Submit new request
  const handleRaiseRequestSubmit = async (e) => {
    e.preventDefault();
    setFormValidationError('');

    if (!raiseAssetId) {
      setFormValidationError('Please select an asset');
      return;
    }
    if (!raiseIssue || !raiseIssue.trim()) {
      setFormValidationError('Please describe the issue');
      return;
    }

    setActionPending(true);
    try {
      await maintenanceService.raiseRequest({
        assetId: raiseAssetId,
        issue: raiseIssue,
        priority: raisePriority,
        raisedByUserId: currentUser?.uid || 'mock-user-id',
        photoNote: raisePhotoNote
      });

      triggerToast('success', 'Maintenance request submitted successfully!');
      
      // Reset form
      setRaiseAssetId('');
      setRaiseIssue('');
      setRaisePriority('Medium');
      setRaisePhotoNote('');
      
      // Refresh list
      await fetchData();
    } catch (err) {
      triggerToast('error', err.message || 'Failed to submit request');
    } finally {
      setActionPending(false);
    }
  };

  // 1. Approve Pending Card
  const handleApprove = async (requestId) => {
    setActionPending(true);
    setToast(null);
    try {
      await maintenanceService.approveMaintenance(requestId);
      triggerToast('success', 'Maintenance approved! Asset is now Under Maintenance.');
      await fetchData();
    } catch (err) {
      triggerToast('error', err.message || 'Failed to approve request');
    } finally {
      setActionPending(false);
    }
  };

  // 2. Reject Pending Card
  const handleConfirmReject = async (requestId) => {
    if (!rejectReason || !rejectReason.trim()) {
      triggerToast('error', 'A rejection reason is required');
      return;
    }

    setActionPending(true);
    setToast(null);
    try {
      await maintenanceService.rejectMaintenance(requestId, rejectReason);
      triggerToast('success', 'Maintenance request rejected.');
      setRejectingId(null);
      setRejectReason('');
      await fetchData();
    } catch (err) {
      triggerToast('error', err.message || 'Failed to reject request');
    } finally {
      setActionPending(false);
    }
  };

  // 3. Assign Technician (Approved -> Technician Assigned)
  const handleConfirmAssign = async (requestId) => {
    if (!techName || !techName.trim()) {
      triggerToast('error', 'Technician name is required');
      return;
    }

    setActionPending(true);
    setToast(null);
    try {
      await maintenanceService.assignTechnician(requestId, techName);
      triggerToast('success', `Technician "${techName}" assigned.`);
      setAssigningId(null);
      setTechName('');
      await fetchData();
    } catch (err) {
      triggerToast('error', err.message || 'Failed to assign technician');
    } finally {
      setActionPending(false);
    }
  };

  // 4. Start Work (Technician Assigned -> In Progress)
  const handleStartWork = async (requestId) => {
    setActionPending(true);
    setToast(null);
    try {
      await maintenanceService.startWork(requestId);
      triggerToast('success', 'Work started on request.');
      await fetchData();
    } catch (err) {
      triggerToast('error', err.message || 'Failed to start work');
    } finally {
      setActionPending(false);
    }
  };

  // 5. Resolve Work (In Progress -> Resolved)
  const handleConfirmResolve = async (requestId) => {
    if (!resNotes || !resNotes.trim()) {
      triggerToast('error', 'Resolution notes are required');
      return;
    }

    setActionPending(true);
    setToast(null);
    try {
      await maintenanceService.resolveMaintenance(requestId, resNotes);
      triggerToast('success', 'Maintenance resolved! Asset is now Available.');
      setResolvingId(null);
      setResNotes('');
      await fetchData();
    } catch (err) {
      triggerToast('error', err.message || 'Failed to resolve maintenance');
    } finally {
      setActionPending(false);
    }
  };

  // Filter lists for Kanban columns and Rejected list
  const activeRequests = requests.filter(r => r.status !== 'Rejected');
  const rejectedRequests = requests.filter(r => r.status === 'Rejected');

  const columns = ['Pending', 'Approved', 'Technician Assigned', 'In Progress', 'Resolved'];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold uppercase tracking-wider text-asset-light">Asset Maintenance</h2>
        <p className="text-xs text-stone-500 font-mono mt-0.5">MANAGE CORRECTION WORKFLOWS AND REPAIRS</p>
      </div>

      {/* Notifications */}
      {initialError && (
        <div className="bg-red-950/80 border border-red-900 text-red-200 px-4 py-3 rounded-lg text-xs">
          ⚠️ {initialError}
        </div>
      )}

      {toast && (
        <div className={`border px-4 py-3 rounded-lg flex items-center justify-between text-xs transition-all animate-fadeIn ${
          toast.type === 'success' 
            ? 'bg-stone-900 border-asset-green text-asset-light' 
            : 'bg-red-950/80 border-red-900 text-red-200'
        }`}>
          <span className="flex items-center gap-2">
            {toast.type === 'success' && <span className="h-1.5 w-1.5 rounded-full bg-asset-green"></span>}
            {toast.message}
          </span>
          <button onClick={() => setToast(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Request Form Panel */}
      <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-4 shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">Raise Maintenance Request</h3>
        
        <form onSubmit={handleRaiseRequestSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          {/* Asset picker */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Asset *</label>
            {assets.length === 0 ? (
              <div className="text-stone-500 text-xs py-2">No assets registered.</div>
            ) : (
              <select
                value={raiseAssetId}
                onChange={(e) => {
                  setRaiseAssetId(e.target.value);
                  setFormValidationError('');
                }}
                className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
                required
              >
                <option value="">-- Choose Asset --</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.tag} - {asset.name} ({asset.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Issue description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Issue / Defect *</label>
            <input
              type="text"
              value={raiseIssue}
              onChange={(e) => {
                setRaiseIssue(e.target.value);
                setFormValidationError('');
              }}
              placeholder="e.g. Cracked display, faulty keyboard"
              className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
              required
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Priority *</label>
            <select
              value={raisePriority}
              onChange={(e) => setRaisePriority(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
              required
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Photo Note */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Photo note (optional)</label>
            <input
              type="text"
              value={raisePhotoNote}
              onChange={(e) => setRaisePhotoNote(e.target.value)}
              placeholder="Describe or paste note link..."
              className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
            />
          </div>

          {/* Submit */}
          <div className="sm:col-span-2 md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={actionPending || assets.length === 0}
              className="bg-asset-green hover:bg-opacity-90 text-asset-light rounded px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {actionPending ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
        {formValidationError && <p className="text-[10px] text-red-500 mt-1">{formValidationError}</p>}
      </div>

      {/* KANBAN BOARD */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 gap-3 bg-stone-950 border border-stone-850 rounded-lg">
          <span className="h-8 w-8 rounded-full border-4 border-stone-800 border-t-asset-green animate-spin"></span>
          <p className="text-[10px] text-stone-500 font-mono tracking-wider uppercase">Loading Kanban Workspace...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 5 Column Board */}
          <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4">
            {columns.map((colName) => {
              const colCards = activeRequests.filter(r => r.status === colName);
              return (
                <div key={colName} className="flex-1 min-w-[240px] bg-stone-950/40 border border-stone-850 p-4 rounded-lg flex flex-col min-h-[500px]">
                  
                  {/* Column Header */}
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-stone-850">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{colName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-900 text-stone-500 font-mono">
                      {colCards.length}
                    </span>
                  </div>

                  {/* Cards container */}
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {colCards.map((card) => (
                      <div
                        key={card.id}
                        className={`bg-stone-900 border p-4 rounded-lg space-y-2.5 shadow-sm transition-all duration-150 ${
                          card.status === 'Resolved' 
                            ? 'border-emerald-950/80 bg-stone-900/60' 
                            : 'border-stone-850'
                        }`}
                      >
                        {/* Name & Tag */}
                        <div className="flex justify-between items-start">
                          <span className="text-[11px] font-bold text-asset-light tracking-wide truncate pr-2 max-w-[130px]" title={card.assetName}>
                            {card.assetName}
                          </span>
                          <span className="text-[9px] font-mono text-emerald-400 font-bold shrink-0">{card.assetTag}</span>
                        </div>

                        {/* Issue description */}
                        <p className="text-[11px] text-stone-400 leading-snug line-clamp-3 break-words" title={card.issue}>
                          {card.issue}
                        </p>

                        {/* Badges / Meta row */}
                        <div className="flex justify-between items-center pt-1">
                          {card.priority === 'Low' && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-stone-850 text-stone-500 border border-stone-800 uppercase font-bold tracking-wider">Low</span>
                          )}
                          {card.priority === 'Medium' && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-bold tracking-wider">Medium</span>
                          )}
                          {card.priority === 'High' && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 uppercase font-bold tracking-wider">High</span>
                          )}
                          {card.photoNote && (
                            <span className="text-[9px] text-stone-500 font-mono" title={card.photoNote}>📷 Note</span>
                          )}
                        </div>

                        {/* Actions block based on Column */}
                        
                        {/* Pending Actions */}
                        {card.status === 'Pending' && (
                          <div className="pt-2 border-t border-stone-850/50">
                            {currentUser?.role === 'AssetManager' ? (
                              rejectingId === card.id ? (
                                <div className="space-y-1.5">
                                  <input
                                    type="text"
                                    placeholder="Rejection reason..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full bg-stone-950 border border-stone-850 rounded px-2 py-1 text-[10px] text-asset-light focus:outline-none focus:border-red-900"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleConfirmReject(card.id)}
                                      className="bg-red-950 hover:bg-red-900 text-red-400 border border-red-900 px-2 py-0.5 rounded text-[9px] uppercase font-bold"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                      className="text-stone-500 hover:text-stone-300 text-[9px] uppercase font-bold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApprove(card.id)}
                                    className="flex-1 bg-asset-green/20 hover:bg-asset-green/45 text-emerald-400 border border-asset-green/30 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-all"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => { setRejectingId(card.id); setRejectReason(''); }}
                                    className="flex-1 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-all"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )
                            ) : (
                              <div className="text-[8px] text-stone-500 uppercase tracking-widest text-center">
                                Review Gated (AssetManager only)
                              </div>
                            )}
                          </div>
                        )}

                        {/* Approved Actions */}
                        {card.status === 'Approved' && (
                          <div className="pt-2 border-t border-stone-850/50">
                            {/* Any authenticated user can assign technician */}
                            {assigningId === card.id ? (
                              <div className="space-y-1.5">
                                <input
                                  type="text"
                                  placeholder="Technician name..."
                                  value={techName}
                                  onChange={(e) => setTechName(e.target.value)}
                                  className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-[10px] text-asset-light focus:outline-none focus:border-asset-green"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleConfirmAssign(card.id)}
                                    className="bg-asset-green hover:bg-opacity-95 text-asset-light px-2 py-0.5 rounded text-[9px] uppercase font-bold"
                                  >
                                    Assign
                                  </button>
                                  <button
                                    onClick={() => { setAssigningId(null); setTechName(''); }}
                                    className="text-stone-500 hover:text-stone-300 text-[9px] uppercase font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setAssigningId(card.id); setTechName(''); }}
                                className="w-full bg-stone-950 border border-stone-800 hover:bg-stone-900 text-stone-400 hover:text-asset-light rounded py-1 text-[10px] uppercase font-bold tracking-wider transition-all"
                              >
                                Assign Technician
                              </button>
                            )}
                          </div>
                        )}

                        {/* Technician Assigned Actions */}
                        {card.status === 'Technician Assigned' && (
                          <div className="pt-2 border-t border-stone-850/50 space-y-2">
                            <div className="text-[9px] text-stone-400">Assigned: <strong className="text-stone-300">{card.technicianName}</strong></div>
                            <button
                              onClick={() => handleStartWork(card.id)}
                              className="w-full bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 text-sky-400 rounded py-1 text-[10px] uppercase font-bold tracking-wider transition-all"
                            >
                              Start Work
                            </button>
                          </div>
                        )}

                        {/* In Progress Actions */}
                        {card.status === 'In Progress' && (
                          <div className="pt-2 border-t border-stone-850/50">
                            <div className="text-[9px] text-stone-400 mb-2">Tech: <strong className="text-stone-300">{card.technicianName}</strong></div>
                            {resolvingId === card.id ? (
                              <div className="space-y-1.5">
                                <textarea
                                  placeholder="Resolution details..."
                                  value={resNotes}
                                  onChange={(e) => setResNotes(e.target.value)}
                                  rows="2"
                                  className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-[10px] text-asset-light focus:outline-none focus:border-asset-green"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleConfirmResolve(card.id)}
                                    className="bg-asset-green hover:bg-opacity-95 text-asset-light px-2 py-0.5 rounded text-[9px] uppercase font-bold"
                                  >
                                    Resolve
                                  </button>
                                  <button
                                    onClick={() => { setResolvingId(null); setResNotes(''); }}
                                    className="text-stone-500 hover:text-stone-300 text-[9px] uppercase font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setResolvingId(card.id); setResNotes(''); }}
                                className="w-full bg-asset-green/10 border border-asset-green/30 hover:bg-asset-green/20 text-emerald-400 rounded py-1 text-[10px] uppercase font-bold tracking-wider transition-all"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        )}

                        {/* Resolved State Details */}
                        {card.status === 'Resolved' && (
                          <div className="pt-2 border-t border-stone-850/50 space-y-1 text-[9px] text-stone-500 font-sans leading-relaxed">
                            <div>Tech: <strong className="text-stone-400">{card.technicianName}</strong></div>
                            <div>Resolved: <span className="font-semibold text-stone-400 font-mono">{card.resolvedDate}</span></div>
                            <div className="italic text-stone-300 mt-1">"{card.resolutionNotes}"</div>
                          </div>
                        )}

                      </div>
                    ))}
                    {colCards.length === 0 && (
                      <div className="flex-grow flex items-center justify-center border border-dashed border-stone-850/40 rounded-lg py-12">
                        <span className="text-[9px] text-stone-600 uppercase font-mono tracking-wider">No Items</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Caption */}
          <div className="text-center pt-2">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold font-mono">
              Approving a card moves the asset to Under Maintenance, resolving returns it to Available
            </span>
          </div>

          {/* Terminal Rejected Cards Section */}
          {rejectedRequests.length > 0 && (
            <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-3 shadow-md mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">Rejected Requests</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {rejectedRequests.map((req) => (
                  <div key={req.id} className="bg-stone-900 border border-red-950/40 p-4 rounded text-xs space-y-1.5">
                    <div className="flex justify-between items-start">
                      <strong className="text-stone-300 truncate max-w-[130px]">{req.assetName}</strong>
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-950/20 text-red-400 border border-red-900/30 uppercase tracking-wider font-bold shrink-0">{req.assetTag}</span>
                    </div>
                    <p className="text-stone-400 leading-snug break-words">Issue: {req.issue}</p>
                    <p className="text-stone-500 text-[10px] italic leading-normal border-t border-stone-850 pt-1.5">Rejection reason: "{req.rejectionReason}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
