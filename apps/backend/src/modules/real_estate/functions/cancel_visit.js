const { getBookingById, cancelBooking } = require("./schedule_visit");
const logger = require("../../../config/logger");

/**
 * Cancel a scheduled property visit
 */
async function execute(parameters, context = {}) {
  try {
    const { booking_id, property_id, reason } = parameters;

    logger.info("Cancelling property visit", { parameters });

    // Find booking by ID or property ID
    let booking = null;

    if (booking_id) {
      booking = getBookingById(booking_id);
    } else if (property_id) {
      // Find booking by property ID for current user
      booking = findBookingByPropertyId(property_id, context.userPhone);
    }

    if (!booking) {
      return {
        success: false,
        error: "Booking not found",
        response:
          "I couldn't find any scheduled visit with that information. Please check your booking ID or property details and try again.",
      };
    }

    // Check if booking can be cancelled
    if (booking.status === "cancelled") {
      return {
        success: false,
        error: "Booking already cancelled",
        response: "This visit has already been cancelled.",
      };
    }

    if (booking.status === "completed") {
      return {
        success: false,
        error: "Booking already completed",
        response:
          "This visit has already been completed and cannot be cancelled.",
      };
    }

    // Check cancellation time limit (2 hours before visit)
    const visitDateTime = new Date(
      `${booking.scheduledDate} ${booking.scheduledTime}`
    );
    const now = new Date();
    const timeDifference = visitDateTime - now;
    const hoursUntilVisit = timeDifference / (1000 * 60 * 60);

    if (hoursUntilVisit < 2) {
      return {
        success: false,
        error: "Cancellation time limit exceeded",
        response:
          "Sorry, you can only cancel visits up to 2 hours before the scheduled time. Please contact our support team for assistance.",
      };
    }

    // Cancel the booking
    const cancelled = cancelBooking(booking.id, reason);

    if (!cancelled) {
      return {
        success: false,
        error: "Failed to cancel booking",
        response:
          "I encountered an error while cancelling your visit. Please try again or contact our support team.",
      };
    }

    // Format response
    const response = formatCancellationConfirmation(booking, reason);

    return {
      success: true,
      result: {
        bookingId: booking.id,
        status: "cancelled",
        cancelledAt: new Date(),
        reason: reason,
      },
      response: response,
    };
  } catch (error) {
    logger.error("Visit cancellation failed", {
      error: error.message,
      parameters,
    });
    return {
      success: false,
      error: error.message,
      response:
        "I encountered an error while cancelling your visit. Please try again.",
    };
  }
}

/**
 * Find booking by property ID for a specific user
 */
function findBookingByPropertyId(propertyId, userPhone) {
  // This would typically query the database
  // For now, we'll use a mock implementation
  const mockBookings = require("./schedule_visit").mockBookings || [];

  return mockBookings.find(
    (booking) =>
      booking.propertyId === propertyId &&
      booking.userPhone === userPhone &&
      booking.status !== "cancelled" &&
      booking.status !== "completed"
  );
}

/**
 * Format cancellation confirmation message
 */
function formatCancellationConfirmation(booking, reason) {
  let response = `✅ **Visit Cancelled Successfully**\n\n`;
  response += `📋 **Cancellation Details:**\n`;
  response += `🆔 Booking ID: ${booking.id}\n`;
  response += `🏠 Property: ${booking.propertyName}\n`;
  response += `📅 Scheduled Date: ${formatDate(booking.scheduledDate)}\n`;
  response += `⏰ Scheduled Time: ${booking.scheduledTime}\n`;
  response += `❌ Status: Cancelled\n`;
  response += `📅 Cancelled On: ${formatDate(new Date())}\n`;

  if (reason) {
    response += `📝 Reason: ${reason}\n`;
  }

  response += `\n💡 **What's Next?**\n`;
  response += `• You can schedule a new visit anytime\n`;
  response += `• Browse other properties if you're interested\n`;
  response += `• Contact our support team for any assistance\n\n`;

  response += `🔄 **To Schedule a New Visit:**\n`;
  response += `Say "Schedule a visit for [property name]" or "Book a visit for property [ID]"`;

  return response;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get user's active bookings
 */
function getUserActiveBookings(userPhone) {
  // Mock implementation - in real app, this would query the database
  const mockBookings = require("./schedule_visit").mockBookings || [];

  return mockBookings.filter(
    (booking) =>
      booking.userPhone === userPhone && booking.status === "confirmed"
  );
}

/**
 * Reschedule a booking
 */
function rescheduleBooking(bookingId, newDate, newTime) {
  const booking = getBookingById(bookingId);
  if (booking) {
    booking.scheduledDate = newDate;
    booking.scheduledTime = newTime;
    booking.rescheduledAt = new Date();
    return true;
  }
  return false;
}

module.exports = {
  execute,
  findBookingByPropertyId,
  getUserActiveBookings,
  rescheduleBooking,
};
