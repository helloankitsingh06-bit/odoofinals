import { assetService } from './assetService';

const API_BASE_URL = 'http://localhost:5001/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'AssetManager',
      'x-user-id': 'mock-employee-1',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.error || 'Request failed');
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export const allocationService = {
  async allocateAsset(assetId, employeeId, departmentId, expectedReturnDate) {
    return request('/allocations', {
      method: 'POST',
      body: JSON.stringify({
        asset: assetId,
        employee: employeeId || undefined,
        department: departmentId || undefined,
        expectedReturnDate: expectedReturnDate || undefined
      })
    });
  },

  async requestTransfer(assetId, fromUserId, toUserId, requestedByUserId, reason) {
    return request('/transfers', {
      method: 'POST',
      body: JSON.stringify({
        asset: assetId,
        fromHolder: fromUserId,
        toHolder: toUserId,
        requestedBy: requestedByUserId,
        reason
      })
    });
  },

  async approveTransfer(transferId) {
    return request(`/transfers/${transferId}/approve`, {
      method: 'PATCH'
    });
  },

  async rejectTransfer(transferId, reason) {
    return request(`/transfers/${transferId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejectionReason: reason })
    });
  },

  async getAllocationHistory(assetId) {
    const data = await request(`/allocations?asset=${assetId}`);
    return (Array.isArray(data) ? data : []).map((entry) => ({
      date: entry.allocatedDate || entry.createdAt,
      description: `Allocated to ${entry.employee?.name || entry.department?.name || 'Unknown'} (${entry.status})`
    }));
  },

  async returnAsset(assetId, conditionNotes) {
    const allocation = await request(`/allocations?asset=${assetId}`);
    const active = Array.isArray(allocation) ? allocation.find((item) => item.status === 'Active') : null;
    if (!active) throw new Error('No active allocation found');

    return request(`/allocations/${active._id}/return`, {
      method: 'PATCH',
      body: JSON.stringify({
        conditionAtCheckin: conditionNotes,
        checkinNotes: conditionNotes
      })
    });
  },

  async getPendingTransferForAsset(assetId) {
    const data = await request(`/transfers?status=Requested`);
    const items = Array.isArray(data) ? data : [];
    return items.find((item) => item.asset?._id === assetId || item.asset === assetId) || null;
  },

  async getActiveAllocationForAsset(assetId) {
    const data = await request(`/allocations?asset=${assetId}`);
    const items = Array.isArray(data) ? data : [];
    return items.find((item) => item.status === 'Active') || null;
  },

  async getOverdueAllocations() {
    return request('/allocations/overdue');
  }
};
