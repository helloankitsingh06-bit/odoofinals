// TODO: Replace with real Backend A/B exports

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory data store for prototyping (resets on page reload)
let categories = [];
let assets = [];

export const ASSET_STATUSES = ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'];

export const assetService = {
  async listCategories() {
    // TODO: replace with real Firestore query (e.g. getDocs(collection(db, 'categories')))
    await delay(300);
    return [...categories];
  },

  async createCategory(catData) {
    // TODO: replace with real Firestore add (e.g. addDoc(collection(db, 'categories'), catData))
    await delay(400);
    if (!catData.name) throw new Error('Category name is required');
    
    const newCat = {
      id: `cat-${Date.now()}`,
      name: catData.name,
      extraFields: catData.extraFields || []
    };
    
    categories.push(newCat);
    return newCat;
  },

  async listAssets({ search = '', category = '', status = '', department = '' } = {}) {
    await delay(300);
    let filtered = [...assets];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(asset => 
        (asset.tag && asset.tag.toLowerCase().includes(q)) ||
        (asset.serialNumber && asset.serialNumber.toLowerCase().includes(q)) ||
        (asset.name && asset.name.toLowerCase().includes(q))
      );
    }

    if (category) {
      filtered = filtered.filter(asset => asset.category === category);
    }

    if (status) {
      filtered = filtered.filter(asset => asset.status === status);
    }

    if (department) {
      filtered = filtered.filter(asset => asset.department === department);
    }

    return filtered;
  },

  async registerAsset(data) {
    await delay(300);

    const requiredFields = ['name', 'category', 'serialNumber', 'acquisitionDate', 'acquisitionCost', 'condition', 'location'];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        const formattedField = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        throw new Error(`${formattedField} is required`);
      }
    }

    const nextNum = assets.length + 1;
    const tag = `AF-${String(nextNum).padStart(4, '0')}`;

    const newAsset = {
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tag,
      name: data.name,
      category: data.category,
      serialNumber: data.serialNumber,
      acquisitionDate: data.acquisitionDate,
      acquisitionCost: Number(data.acquisitionCost),
      condition: data.condition,
      location: data.location,
      isShared: !!data.isShared,
      status: 'Available',
      createdAt: new Date().toISOString()
    };

    assets.push(newAsset);
    return newAsset;
  },

  async getAssetById(assetId) {
    await delay(300);
    return assets.find(asset => asset.id === assetId) || null;
  },

  async updateAssetStatus(assetId, newStatus) {
    await delay(300);
    const index = assets.findIndex(asset => asset.id === assetId);
    if (index === -1) throw new Error('Asset not found');
    assets[index] = { ...assets[index], status: newStatus };
    return assets[index];
  }
};
