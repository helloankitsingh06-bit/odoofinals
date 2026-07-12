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
  }
};
