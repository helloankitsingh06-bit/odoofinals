// TODO: Replace with real Backend A/B exports

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory data store for activity logs (resets on page reload)
let activityLogs = [];

export const activityService = {
  async listActivityLogs() {
    // TODO: replace with real Firestore query fetching activity logs from 'activityLogs' collection:
    // query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'))
    await delay(300);
    return [...activityLogs];
  }
};
