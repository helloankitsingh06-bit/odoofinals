// TODO: Replace with real Backend A/B exports

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory data store for prototyping (resets on page reload)
let categories = [];

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

  async getKpiCounts() {
    // TODO: replace with real Firestore queries counting status states in the 'assets' and 'bookings' collections:
    // - Available: query(collection(db, 'assets'), where('status', '==', 'available'))
    // - Allocated: query(collection(db, 'assets'), where('status', '==', 'allocated'))
    // - Under Maintenance: query(collection(db, 'assets'), where('status', '==', 'maintenance'))
    // - Active Bookings: query(collection(db, 'bookings'), where('status', '==', 'active'))
    // - Pending Transfers: query(collection(db, 'transfers'), where('status', '==', 'pending'))
    // - Upcoming Returns: query(collection(db, 'allocations'), where('returnDue', '>=', today), where('status', '==', 'allocated'))
    await delay(300);
    return {
      available: 0,
      allocated: 0,
      underMaintenance: 0,
      activeBookings: 0,
      pendingTransfers: 0,
      upcomingReturns: 0
    };
  },

  async getOverdueReturns() {
    // TODO: replace with real Firestore query fetching overdue returns from 'allocations' collection:
    // query(collection(db, 'allocations'), where('returnDue', '<', today), where('status', '==', 'allocated'))
    await delay(350);
    return [];
  }
};
