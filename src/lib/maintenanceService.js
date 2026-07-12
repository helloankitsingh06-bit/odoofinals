import { assetService } from './assetService';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory data store for prototyping (resets on page reload)
let requests = [];

export const maintenanceService = {
  async listRequests() {
    await delay(300);
    return [...requests];
  },

  async raiseRequest({ assetId, issue, priority, raisedByUserId, photoNote }) {
    await delay(300);

    if (!assetId) {
      throw new Error('Asset selection is required');
    }
    if (!issue || !issue.trim()) {
      throw new Error('Issue description is required');
    }
    if (!priority) {
      throw new Error('Priority selection is required');
    }

    const asset = await assetService.getAssetById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    const newRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      assetId,
      assetName: asset.name,
      assetTag: asset.tag,
      issue: issue.trim(),
      priority,
      status: 'Pending',
      photoNote: photoNote ? photoNote.trim() : '',
      raisedByUserId,
      raisedDate: new Date().toISOString().split('T')[0],
      technicianName: '',
      resolvedDate: '',
      resolutionNotes: '',
      rejectionReason: ''
    };

    requests.push(newRequest);
    return newRequest;
  },

  async approveMaintenance(requestId) {
    await delay(300);

    const req = requests.find(r => r.id === requestId);
    if (!req) {
      throw new Error('Request not found');
    }
    if (req.status !== 'Pending') {
      throw new Error(`Transition Error: Cannot approve a request in status '${req.status}'. Must be 'Pending'.`);
    }

    req.status = 'Approved';
    
    // Sync asset status to Under Maintenance
    await assetService.updateAssetStatus(req.assetId, 'Under Maintenance');
    return req;
  },

  async assignTechnician(requestId, technicianName) {
    await delay(300);

    if (!technicianName || !technicianName.trim()) {
      throw new Error('Technician name is required');
    }

    const req = requests.find(r => r.id === requestId);
    if (!req) {
      throw new Error('Request not found');
    }
    if (req.status !== 'Approved') {
      throw new Error(`Transition Error: Cannot assign technician to a request in status '${req.status}'. Must be 'Approved'.`);
    }

    req.status = 'Technician Assigned';
    req.technicianName = technicianName.trim();
    return req;
  },

  async startWork(requestId) {
    await delay(300);

    const req = requests.find(r => r.id === requestId);
    if (!req) {
      throw new Error('Request not found');
    }
    if (req.status !== 'Technician Assigned') {
      throw new Error(`Transition Error: Cannot start work on a request in status '${req.status}'. Must be 'Technician Assigned'.`);
    }

    req.status = 'In Progress';
    return req;
  },

  async resolveMaintenance(requestId, resolutionNotes) {
    await delay(300);

    if (!resolutionNotes || !resolutionNotes.trim()) {
      throw new Error('Resolution notes are required');
    }

    const req = requests.find(r => r.id === requestId);
    if (!req) {
      throw new Error('Request not found');
    }
    if (req.status !== 'In Progress') {
      throw new Error(`Transition Error: Cannot resolve a request in status '${req.status}'. Must be 'In Progress'.`);
    }

    req.status = 'Resolved';
    req.resolutionNotes = resolutionNotes.trim();
    req.resolvedDate = new Date().toISOString().split('T')[0];

    // Sync asset status back to Available
    await assetService.updateAssetStatus(req.assetId, 'Available');
    return req;
  },

  async rejectMaintenance(requestId, reason) {
    await delay(300);

    const req = requests.find(r => r.id === requestId);
    if (!req) {
      throw new Error('Request not found');
    }
    if (req.status !== 'Pending') {
      throw new Error(`Transition Error: Cannot reject a request in status '${req.status}'. Must be 'Pending'.`);
    }

    req.status = 'Rejected';
    req.rejectionReason = reason ? reason.trim() : 'No reason provided';
    return req;
  }
};
