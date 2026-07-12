/**
 * Audit Service Stub
 * Handles audit cycles and checklist items.
 */

export const auditService = {
  /**
   * Fetch the current active active audit cycle.
   * // TODO: replace with real Backend A/B Firestore export
   * @returns {Promise<Object|null>} Current active audit cycle or null if none.
   */
  getCurrentAuditCycle: async () => {
    // Simulate API delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(null); // Resolves to null/empty for now
      }, 100);
    });
  },

  /**
   * List all audit checklist items for the current cycle.
   * // TODO: replace with real Backend A/B Firestore export
   * @returns {Promise<Array>} List of audit checklist items.
   */
  listAuditItems: async () => {
    // Simulate API delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]); // Resolves to empty array for now
      }, 100);
    });
  }
};
