/**
 * Reports Service Stub
 * Handles reports and analytics data fetching.
 */

export const reportsService = {
  /**
   * Fetch utilization statistics by department.
   * // TODO: replace with real Backend A/B Firestore aggregation query
   * @returns {Promise<Array>} List of { department, percentage }
   */
  getUtilizationByDept: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]); // Resolves to empty for now
      }, 100);
    });
  },

  /**
   * Fetch maintenance frequency logs by asset category/month.
   * // TODO: replace with real Backend A/B Firestore aggregation query
   * @returns {Promise<Array>} List of { label, count }
   */
  getMaintenanceFrequency: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]); // Resolves to empty for now
      }, 100);
    });
  },

  /**
   * Fetch most heavily used assets.
   * // TODO: replace with real Backend A/B Firestore query
   * @returns {Promise<Array>} List of { id, name, code, bookingsCount, hoursUsed }
   */
  getMostUsedAssets: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]); // Resolves to empty for now
      }, 100);
    });
  },

  /**
   * Fetch assets currently idle.
   * // TODO: replace with real Backend A/B Firestore query
   * @returns {Promise<Array>} List of { id, name, code, idleDays }
   */
  getIdleAssets: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]); // Resolves to empty for now
      }, 100);
    });
  },

  /**
   * Fetch upcoming maintenance alerts (due or nearing retirement).
   * // TODO: replace with real Backend A/B Firestore query
   * @returns {Promise<Array>} List of { id, name, code, alertType, dueDate }
   */
  getUpcomingMaintenanceAlerts: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]); // Resolves to empty for now
      }, 100);
    });
  }
};
