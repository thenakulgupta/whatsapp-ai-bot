const logger = require("../../../config/logger");

// Mock booking database
const mockBookings = [];

/**
 * Schedule a property visit
 */
async function execute(parameters, context = {}) {
  try {
    const {
      property_id,
      visit_type = "physical",
      preferred_date,
      preferred_time,
      contact_number,
    } = parameters;

    logger.info("Scheduling property visit", { parameters });

    // Validate required parameters
    if (!property_id) {
      return {
        success: false,
        error: "Property ID is required",
        response:
          "Please specify which property you'd like to visit. You can use the property name or ID from the search results.",
      };
    }

    // Generate booking ID
    const bookingId = generateBookingId();

    // Set default values
    const visitDate = preferred_date || getNextAvailableDate();
    const visitTime = preferred_time || "2:00 PM";
    const contact = contact_number || context.userPhone || "Not provided";

    // Create booking
    const booking = {
      id: bookingId,
      propertyId: property_id,
      propertyName: getPropertyName(property_id),
      visitType: visit_type,
      scheduledDate: visitDate,
      scheduledTime: visitTime,
      contactNumber: contact,
      status: "confirmed",
      createdAt: new Date(),
      userPhone: context.userPhone,
      sessionId: context.sessionId,
    };

    // Store booking (in real app, this would be saved to database)
    mockBookings.push(booking);

    // Format response
    const response = formatBookingConfirmation(booking);

    return {
      success: true,
      result: booking,
      response: response,
    };
  } catch (error) {
    logger.error("Visit scheduling failed", {
      error: error.message,
      parameters,
    });
    return {
      success: false,
      error: error.message,
      response:
        "I encountered an error while scheduling your visit. Please try again.",
    };
  }
}

/**
 * Generate unique booking ID
 */
function generateBookingId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `VST${timestamp}${random}`;
}

/**
 * Get next available date (mock implementation)
 */
function getNextAvailableDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD format
}

/**
 * Get property name by ID (mock implementation)
 */
function getPropertyName(propertyId) {
  const propertyNames = {
    RE001: "Green Valley Apartments",
    RE002: "Royal Gardens",
    RE003: "Luxury Villa",
    RE004: "Modern Heights",
    RE005: "Garden View",
  };

  return propertyNames[propertyId] || propertyId;
}

/**
 * Format booking confirmation message
 */
function formatBookingConfirmation(booking) {
  let response = `✅ **Visit Scheduled Successfully!**\n\n`;
  response += `📋 **Booking Details:**\n`;
  response += `🆔 Booking ID: ${booking.id}\n`;
  response += `🏠 Property: ${booking.propertyName}\n`;
  response += `📅 Date: ${formatDate(booking.scheduledDate)}\n`;
  response += `⏰ Time: ${booking.scheduledTime}\n`;
  response += `📱 Visit Type: ${
    booking.visitType.charAt(0).toUpperCase() + booking.visitType.slice(1)
  }\n`;
  response += `📞 Contact: ${booking.contactNumber}\n\n`;

  if (booking.visitType === "physical") {
    response += `📍 **Physical Visit Instructions:**\n`;
    response += `• Please arrive 10 minutes before your scheduled time\n`;
    response += `• Bring a valid ID proof\n`;
    response += `• Our representative will meet you at the property\n`;
    response += `• Call us if you need to reschedule\n\n`;
  } else {
    response += `💻 **Virtual Tour Instructions:**\n`;
    response += `• We'll send you a meeting link 30 minutes before your tour\n`;
    response += `• Please ensure good internet connection\n`;
    response += `• Have your questions ready for our agent\n\n`;
  }

  response += `📝 **Important Notes:**\n`;
  response += `• You can cancel or reschedule up to 2 hours before your visit\n`;
  response += `• To cancel, say "Cancel my visit booking ${booking.id}"\n`;
  response += `• For any queries, contact our support team\n\n`;

  response += `🎉 We look forward to showing you the property!`;

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
 * Get available time slots for a date
 */
function getAvailableTimeSlots(date) {
  // Mock implementation - in real app, this would check actual availability
  return ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM", "6:00 PM"];
}

/**
 * Check if a time slot is available
 */
function isTimeSlotAvailable(date, time) {
  // Mock implementation - in real app, this would check actual bookings
  const availableSlots = getAvailableTimeSlots(date);
  return availableSlots.includes(time);
}

/**
 * Get booking by ID
 */
function getBookingById(bookingId) {
  return mockBookings.find((booking) => booking.id === bookingId);
}

/**
 * Cancel a booking
 */
function cancelBooking(bookingId, reason = "") {
  const booking = getBookingById(bookingId);
  if (booking) {
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    return true;
  }
  return false;
}

module.exports = {
  execute,
  getBookingById,
  cancelBooking,
  getAvailableTimeSlots,
  isTimeSlotAvailable,
};
