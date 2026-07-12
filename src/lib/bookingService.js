import { assetService } from './assetService';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory data store for prototyping (resets on page reload)
let bookings = [];

export const bookingService = {
  async listBookableResources() {
    await delay(300);
    const allAssets = await assetService.listAssets();
    // Filter by isShared === true or bookable === true
    return allAssets
      .filter(asset => asset.isShared === true || asset.bookable === true)
      .map(asset => ({ id: asset.id, name: asset.name }));
  },

  async listBookings(resourceId, date) {
    await delay(300);
    return bookings
      .filter(b => b.resourceId === resourceId && b.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  },

  async createBooking({ resourceId, resourceName, bookedByUserId, bookedByName, date, startTime, endTime, purpose }) {
    await delay(300);

    if (!resourceId || !resourceName || !bookedByUserId || !bookedByName || !date || !startTime || !endTime || !purpose || !purpose.trim()) {
      throw new Error('All booking fields are required');
    }

    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }

    // Check for overlap with existing non-cancelled bookings
    const activeBookings = bookings.filter(b => 
      b.resourceId === resourceId && 
      b.date === date && 
      b.status !== 'Cancelled'
    );

    for (const b of activeBookings) {
      // Overlap formula: startA < endB AND startB < endA
      if (startTime < b.endTime && b.startTime < endTime) {
        throw new Error(`Conflict: ${resourceName} is already booked ${b.startTime}–${b.endTime} by ${b.bookedByName}`);
      }
    }

    const newBooking = {
      id: `book-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      resourceId,
      resourceName,
      bookedByUserId,
      bookedByName,
      date,
      startTime,
      endTime,
      purpose: purpose.trim(),
      status: 'Upcoming' // 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'
    };

    bookings.push(newBooking);
    return newBooking;
  },

  async cancelBooking(bookingId) {
    await delay(300);
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    booking.status = 'Cancelled';
    return booking;
  },

  async getResourceSchedule(resourceId, date) {
    return this.listBookings(resourceId, date);
  }
};
