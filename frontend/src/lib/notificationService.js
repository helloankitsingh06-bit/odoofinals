/**
 * Notification Service Stub
 * Handles notification logs and status modifications.
 */

export const notificationService = {
  /**
   * List all notification messages for the active user.
   * // TODO: replace with real Backend A/B Firestore query (collection 'notifications' ordered by timestamp descending)
   * @returns {Promise<Array>} List of notifications
   */
  listNotifications: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]); // Resolves to empty array for now
      }, 100);
    });
  }
};
