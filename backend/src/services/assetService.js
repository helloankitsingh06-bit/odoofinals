// services/assetService.js
const { db } = require('../firebase');

/**
 * Register a new asset.
 * @param {Object} assetData - asset fields
 * @param {string} assetData.name - Asset name
 * @param {string} assetData.categoryId - Firestore doc ID of the category
 * @param {string} assetData.serialNumber - Serial number
 * @param {string} assetData.condition - e.g. 'Good', 'Fair', 'Poor', 'Excellent'
 * @param {string} assetData.location - Physical location
 * @param {Date} assetData.acquisitionDate - Date acquired
 * @param {number} assetData.acquisitionCost - Purchase cost (number)
 * @param {boolean} assetData.sharedBookable - True if bookable by multiple people
 * @param {string} [assetData.photoURL] - Optional photo URL
 * @param {string} [assetData.documentURL] - Optional document URL
 * @returns {Promise<{id: string, assetTag: string}>}
 */
async function registerAsset(assetData) {
  // 1. Validate required fields
  const required = ['name', 'categoryId', 'serialNumber', 'condition', 'location', 'acquisitionDate', 'acquisitionCost'];
  for (const field of required) {
    if (!assetData[field] && assetData[field] !== 0) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // 2. Use a Firestore transaction to safely increment the counter
  const counterRef = db.collection('counters').doc('assetCounter');

  try {
    const result = await db.runTransaction(async (transaction) => {
      // Read current counter
      const counterDoc = await transaction.get(counterRef);
      let currentCount;

      if (!counterDoc.exists) {
        // If counter doesn't exist, count existing assets and set it
        const assetsSnapshot = await db.collection('assets').get();
        currentCount = assetsSnapshot.size; // should be 8 from seed
        transaction.set(counterRef, { count: currentCount });
      } else {
        currentCount = counterDoc.data().count;
      }

      // Increment for the new asset
      const newCount = currentCount + 1;
      const assetTag = `AF-${String(newCount).padStart(4, '0')}`; // AF-0009, AF-0010, etc.

      // Prepare the asset document
      const newAsset = {
        name: assetData.name,
        assetTag: assetTag,
        categoryId: assetData.categoryId,
        serialNumber: assetData.serialNumber,
        condition: assetData.condition,
        location: assetData.location,
        acquisitionDate: assetData.acquisitionDate,
        acquisitionCost: assetData.acquisitionCost,
        sharedBookable: assetData.sharedBookable || false,
        status: 'Available', // Default status
        allocatedToId: null,
        photoURL: assetData.photoURL || null,
        documentURL: assetData.documentURL || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Write to Firestore
      const assetRef = db.collection('assets').doc();
      transaction.set(assetRef, newAsset);

      // Update the counter
      transaction.update(counterRef, { count: newCount });

      return { id: assetRef.id, assetTag };
    });

    console.log(`✅ Asset registered: ${result.assetTag} (ID: ${result.id})`);
    return result;
  } catch (error) {
    console.error('❌ registerAsset failed:', error.message);
    throw error;
  }
}

module.exports = { registerAsset };