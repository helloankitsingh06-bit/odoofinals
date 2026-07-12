// services/bookingService.js
const { db } = require('../firebase');

/**
 * Book a shared resource (asset) for a time slot.
 * Uses Firestore transaction to prevent double-booking.
 * 
 * @param {string} assetId - Firestore doc ID of the asset/resource
 * @param {Date} startTime - Start of booking (Date object)
 * @param {Date} endTime - End of booking (Date object)
 * @param {string} bookedBy - Employee ID (Firestore doc ID)
 * @returns {Promise<{id: string}>} Booking document ID
 * @throws {Error} If overlap is detected or invalid input
 */
async function bookResource(assetId, startTime, endTime, bookedBy) {
  // 1. Validate inputs
  if (!assetId || !startTime || !endTime || !bookedBy) {
    throw new Error('Missing required fields: assetId, startTime, endTime, bookedBy');
  }
  if (startTime >= endTime) {
    throw new Error('startTime must be before endTime');
  }
  if (startTime < new Date()) {
    throw new Error('Cannot book in the past');
  }

  // 2. Run transaction
  const bookingRef = db.collection('bookings').doc();

  try {
    await db.runTransaction(async (transaction) => {
      // 2a. Get all existing bookings for this asset that overlap
      // Overlap condition: newStart < existingEnd AND newEnd > existingStart
      // We'll query for bookings that end after newStart AND start before newEnd
      const overlapQuery = db.collection('bookings')
        .where('assetId', '==', assetId)
        .where('endTime', '>', startTime)
        .where('startTime', '<', endTime)
        .where('status', 'in', ['Upcoming', 'Ongoing']); // Only active bookings matter

      const snapshot = await transaction.get(overlapQuery);

      // 2b. If any exist, reject
      if (!snapshot.empty) {
        const conflicts = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          conflicts.push({
            id: doc.id,
            start: data.startTime.toDate ? data.startTime.toDate() : data.startTime,
            end: data.endTime.toDate ? data.endTime.toDate() : data.endTime,
          });
        });
        throw new Error(`Conflict: asset already booked for overlapping slot(s): ${JSON.stringify(conflicts)}`);
      }

      // 2c. No overlap → create the booking
      const newBooking = {
        assetId,
        bookedBy,
        startTime,
        endTime,
        status: 'Upcoming', // Upcoming, Ongoing, Completed, Cancelled
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      transaction.set(bookingRef, newBooking);
    });

    console.log(`✅ Booking created for asset ${assetId} (ID: ${bookingRef.id})`);
    return { id: bookingRef.id };
  } catch (error) {
    console.error('❌ bookResource failed:', error.message);
    throw error;
  }
}

/**
 * Cancel a booking.
 * @param {string} bookingId - Firestore doc ID
 * @returns {Promise<void>}
 */
async function cancelBooking(bookingId) {
  const bookingRef = db.collection('bookings').doc(bookingId);
  const doc = await bookingRef.get();
  if (!doc.exists) {
    throw new Error(`Booking ${bookingId} not found`);
  }
  const data = doc.data();
  // Only allow cancellation of Upcoming bookings (or Ongoing if you want, but spec says Cancelled status)
  if (data.status === 'Completed' || data.status === 'Cancelled') {
    throw new Error(`Booking already ${data.status}`);
  }
  await bookingRef.update({
    status: 'Cancelled',
    updatedAt: new Date(),
  });
  console.log(`✅ Booking ${bookingId} cancelled`);
}

/**
 * Get the current status of a booking based on current time.
 * This is the "scheduled-ish status updater" – call this on frontend load
 * and update the booking's status in the UI (or optionally write back to Firestore).
 * 
 * @param {Object} booking - Booking object (must have startTime, endTime)
 * @returns {string} 'Upcoming', 'Ongoing', 'Completed', or existing status if Cancelled
 */
function getBookingCurrentStatus(booking) {
  // If already cancelled, keep it cancelled
  if (booking.status === 'Cancelled') return 'Cancelled';

  const now = new Date();
  const start = booking.startTime.toDate ? booking.startTime.toDate() : booking.startTime;
  const end = booking.endTime.toDate ? booking.endTime.toDate() : booking.endTime;

  if (now < start) return 'Upcoming';
  if (now >= start && now <= end) return 'Ongoing';
  if (now > end) return 'Completed';
  return booking.status || 'Upcoming'; // fallback
}

/**
 * Helper: Update a booking's status in Firestore to match current time.
 * This can be called on page load for a specific booking or in a batch job.
 * @param {string} bookingId 
 * @returns {Promise<void>}
 */
async function refreshBookingStatus(bookingId) {
  const bookingRef = db.collection('bookings').doc(bookingId);
  const doc = await bookingRef.get();
  if (!doc.exists) throw new Error('Booking not found');
  const data = doc.data();
  const newStatus = getBookingCurrentStatus(data);
  if (newStatus !== data.status) {
    await bookingRef.update({ status: newStatus, updatedAt: new Date() });
    console.log(`🔄 Booking ${bookingId} status updated to ${newStatus}`);
  }
}

module.exports = {
  bookResource,
  cancelBooking,
  getBookingCurrentStatus,
  refreshBookingStatus,
};