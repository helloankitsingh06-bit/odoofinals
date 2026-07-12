import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assetService } from '../lib/assetService';
import { allocationService } from '../lib/allocationService';
import { maintenanceService } from '../lib/maintenanceService';
import StatusBadge from '../components/StatusBadge';

/**
 * MaintenanceStatusBadge renders a tiny tracked tag with colored borders
 * based on the maintenance status.
 */
function MaintenanceStatusBadge({ status }) {
  let classes = "inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase border ";
  switch (status) {
    case 'Pending':
      classes += "bg-stone-900 text-stone-400 border-stone-800";
      break;
    case 'Approved':
      classes += "bg-amber-500/10 text-amber-400 border-amber-500/20";
      break;
    case 'Technician Assigned':
    case 'In Progress':
      classes += "bg-sky-500/10 text-sky-400 border-sky-500/20";
      break;
    case 'Resolved':
      classes += "bg-asset-green/10 text-emerald-400 border-asset-green/20";
      break;
    case 'Rejected':
      classes += "bg-red-500/10 text-red-400 border-red-500/20";
      break;
    default:
      classes += "bg-stone-900 text-stone-400 border-stone-800";
  }
  return <span className={classes}>{status}</span>;
}

/**
 * PriorityBadge renders a tiny colored tag based on request priority.
 */
function PriorityBadge({ priority }) {
  let classes = "inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase border ";
  if (priority === 'Low') classes += "bg-stone-850 text-stone-500 border-stone-800";
  else if (priority === 'Medium') classes += "bg-amber-500/10 text-amber-400 border-amber-500/20";
  else if (priority === 'High') classes += "bg-red-500/10 text-red-400 border-red-500/20";
  return <span className={classes}>{priority}</span>;
}

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [asset, setAsset] = useState(null);
  const [allocationHistory, setAllocationHistory] = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch asset details, allocation history, and maintenance requests in parallel
  useEffect(() => {
    async function fetchAssetDetails() {
      setLoading(true);
      setError(null);
      try {
        const [assetObj, allocHist, maintHist] = await Promise.all([
          assetService.getAssetById(id),
          allocationService.getAllocationHistory(id),
          maintenanceService.getRequestsByAsset(id)
        ]);

        setAsset(assetObj);
        setAllocationHistory(allocHist);
        setMaintenanceHistory(maintHist);
      } catch (err) {
        console.error('Failed to load asset details:', err);
        setError('An error occurred while fetching the asset details.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchAssetDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-96 gap-3">
        <span className="h-8 w-8 rounded-full border-4 border-stone-800 border-t-asset-green animate-spin"></span>
        <p className="text-[10px] text-stone-500 font-mono tracking-wider uppercase">Loading Asset Details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-4 max-w-3xl mx-auto">
        <div className="bg-red-950/80 border border-red-900 text-red-200 px-4 py-3 rounded-lg text-xs">
          ⚠️ {error}
        </div>
        <button
          onClick={() => navigate('/assets')}
          className="border border-stone-800 hover:bg-stone-900 text-stone-400 hover:text-asset-light rounded px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  // Not found state
  if (!asset) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-96 gap-4 max-w-md mx-auto text-center">
        <div className="text-stone-500 font-mono text-3xl">404</div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-asset-light">Asset Not Found</h3>
        <p className="text-xs text-stone-400 leading-relaxed">
          The asset registry code matching reference ID <code className="font-mono text-emerald-400">"{id}"</code> could not be found or has been purged.
        </p>
        <button
          onClick={() => navigate('/assets')}
          className="border border-stone-800 hover:bg-stone-900 text-stone-400 hover:text-asset-light rounded px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors mt-2"
        >
          Return to directory
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Navigation Header */}
      <div>
        <button
          onClick={() => navigate('/assets')}
          className="border border-stone-800 hover:bg-stone-900 text-stone-400 hover:text-asset-light rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 mb-2"
        >
          <span>← Back to Assets</span>
        </button>
        <p className="text-[10px] text-stone-500 font-mono uppercase">System registry details for asset node</p>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (col-span-2): Asset Info and Maintenance History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Asset Info Card */}
          <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-4 shadow-md">
            {/* Asset Header Info */}
            <div className="flex justify-between items-center pb-4 border-b border-stone-850">
              <div>
                <h2 className="text-lg font-bold uppercase tracking-wider text-asset-light">{asset.name}</h2>
                <span className="text-[10px] text-stone-500 font-mono">TAG REFERENCE: <strong className="text-stone-400 font-mono">{asset.tag}</strong></span>
              </div>
              <StatusBadge status={asset.status} />
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-2 text-xs">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">Category</span>
                <span className="text-asset-light font-medium">{asset.category}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">Serial Number</span>
                <span className="text-asset-light font-mono">{asset.serialNumber}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">Acquisition Date</span>
                <span className="text-asset-light font-mono">{asset.acquisitionDate}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">Acquisition Cost</span>
                <span className="text-asset-light font-mono">
                  ${Number(asset.acquisitionCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">Condition Rating</span>
                <span className="text-asset-light">{asset.condition}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">Current Location</span>
                <span className="text-asset-light">{asset.location}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">Shared Resource / Bookable</span>
                <span className="text-asset-light">{asset.isShared || asset.bookable ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Maintenance History Card */}
          <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-4 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">Maintenance History</h3>
            
            {maintenanceHistory.length === 0 ? (
              <p className="text-xs text-stone-500 font-mono uppercase">No maintenance history yet</p>
            ) : (
              <div className="space-y-4">
                {maintenanceHistory.map((req) => (
                  <div key={req.id} className="bg-stone-900/40 border border-stone-850 p-4 rounded-lg space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-850/50 pb-2">
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={req.priority} />
                        <MaintenanceStatusBadge status={req.status} />
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono">Raised: {req.raisedDate}</span>
                    </div>
                    <p className="text-stone-300 leading-relaxed font-sans">{req.issue}</p>
                    {req.technicianName && (
                      <div className="text-[10px] text-stone-500">
                        Technician: <strong className="text-stone-400">{req.technicianName}</strong>
                      </div>
                    )}
                    {req.status === 'Resolved' && req.resolutionNotes && (
                      <div className="bg-stone-950/60 border border-emerald-950/40 p-2.5 rounded text-[11px] text-stone-400 leading-normal mt-1">
                        <span className="block text-[8px] font-bold uppercase tracking-wider text-emerald-500 mb-0.5 font-mono">Resolution ({req.resolvedDate})</span>
                        "{req.resolutionNotes}"
                      </div>
                    )}
                    {req.status === 'Rejected' && req.rejectionReason && (
                      <div className="bg-red-950/10 border border-red-950/20 p-2.5 rounded text-[11px] text-stone-400 leading-normal mt-1">
                        <span className="block text-[8px] font-bold uppercase tracking-wider text-red-500 mb-0.5 font-mono">Rejection Reason</span>
                        "{req.rejectionReason}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (col-span-1): Allocation History */}
        <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-4 shadow-md self-start">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">Allocation History</h3>
          
          {allocationHistory.length === 0 ? (
            <p className="text-xs text-stone-500 font-mono uppercase">No allocation history yet</p>
          ) : (
            <ul className="space-y-4">
              {allocationHistory.map((evt, idx) => (
                <li key={idx} className="border-l-2 border-stone-800 pl-3 py-0.5 text-xs text-stone-300 font-sans">
                  <div className="text-[9px] text-stone-500 font-bold uppercase font-mono">{evt.date}</div>
                  <div className="mt-0.5 leading-snug">{evt.description}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
