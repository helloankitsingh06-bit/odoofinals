// TODO: Replace with real Backend A/B exports
const API_BASE = "http://localhost:5001/api";

const API_BASE_URL = 'http://localhost:5001/api';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function normalizeAsset(asset = {}) {
  if (!asset || typeof asset !== 'object') return asset;

  return {
    ...asset,
    id: asset.id || asset._id || '',
    tag: asset.tag || asset.assetTag || '—',
    categoryName: asset.categoryName || asset.category?.name || asset.category || '—'
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const ASSET_STATUSES = ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'];

export const assetService = {
  async listCategories() {
    await delay(200);
    const data = await request('/categories');
    return Array.isArray(data) ? data : data.items || [];
  },

  async createCategory(catData) {
    await delay(200);
    const name = (catData.name || '').trim();
    if (!name) throw new Error('Category name is required');

    return request('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, extraFields: catData.extraFields || [] })
    });
  },

  async listAssets({ search = '', category = '', status = '', department = '' } = {}) {
    await delay(200);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (status) params.set('status', status);
    if (department) params.set('department', department);

    const data = await request(`/assets?${params.toString()}`);
    const items = Array.isArray(data) ? data : data.items || [];
    return items.map(normalizeAsset);
  },

  async registerAsset(data) {
    await delay(200);

    const requiredFields = ['name', 'category', 'serialNumber', 'acquisitionDate', 'acquisitionCost', 'condition', 'location'];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        const formattedField = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        throw new Error(`${formattedField} is required`);
      }
    }

    return request('/assets', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        category: data.category,
        serialNumber: data.serialNumber,
        acquisitionDate: data.acquisitionDate,
        acquisitionCost: Number(data.acquisitionCost),
        condition: data.condition,
        location: data.location,
        isBookable: !!data.isShared,
        createdBy: '000000000000000000000000'
      })
    });
  },

  async getAssetById(assetId) {
    await delay(200);
    const asset = await request(`/assets/${assetId}`);
    return normalizeAsset(asset);
  },

  async updateAssetStatus(assetId, newStatus) {
    await delay(200);
    return request(`/assets/${assetId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ newStatus, changedBy: '000000000000000000000000', reason: 'Status updated' })
    });
  },

  async getKpiCounts() {
    try {
      const res = await fetch(`${API_BASE}/dashboard/kpis`);
      if (!res.ok) throw new Error('Failed to fetch KPIs from server');
      const data = await res.json();
      return {
        available: data.available || 0,
        allocated: data.allocated || 0,
        underMaintenance: data.maintenanceToday || 0,
        activeBookings: data.activeBookings || 0,
        pendingTransfers: data.pendingTransfers || 0,
        upcomingReturns: data.overdueCount || 0
      };
    } catch (error) {
      console.error('getKpiCounts failed, falling back to mock:', error);
      return {
        available: 0,
        allocated: 0,
        underMaintenance: 0,
        activeBookings: 0,
        pendingTransfers: 0,
        upcomingReturns: 0
      };
    }
  },

  async getOverdueReturns() {
    try {
      const res = await fetch(`${API_BASE}/dashboard/kpis`);
      if (!res.ok) throw new Error("Failed to fetch KPIs from server");
      const data = await res.json();
      // Map properties from backend database:
      // data.overdueReturns returns list of { id, assetId, assetName, employeeName, expectedReturnDate }
      // We map it to expected fields in Dashboard.jsx:
      // item.assetName, item.assetCode (using assetTag / id), item.daysOverdue (calculate)
      return (data.overdueReturns || []).map(item => {
        const expectedDate = item.expectedReturnDate?.seconds 
          ? new Date(item.expectedReturnDate.seconds * 1000) 
          : new Date(item.expectedReturnDate);
        const diffTime = Math.max(0, new Date() - expectedDate);
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          id: item.id,
          assetName: item.assetName,
          assetCode: item.assetId,
          daysOverdue: daysOverdue || 0
        };
      });
    } catch (error) {
      console.error("getOverdueReturns failed:", error);
      return [];
    }
  }
};
