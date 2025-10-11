const logger = require("../../../config/logger");

// Mock order database
const mockOrders = [
  {
    id: "ORD001",
    orderNumber: "ORD-2024-001",
    customerPhone: "+919876543210",
    customerName: "John Doe",
    status: "delivered",
    orderDate: "2024-01-15T10:30:00Z",
    deliveryDate: "2024-01-18T14:20:00Z",
    totalAmount: 134900,
    items: [
      {
        productId: "EC001",
        productName: "iPhone 15 Pro",
        quantity: 1,
        price: 134900,
      },
    ],
    shippingAddress: {
      name: "John Doe",
      address: "123 Main Street, Sector 29",
      city: "Gurgaon",
      state: "Haryana",
      pincode: "122001",
      phone: "+919876543210",
    },
    trackingInfo: {
      trackingNumber: "TRK123456789",
      carrier: "Blue Dart",
      estimatedDelivery: "2024-01-18T18:00:00Z",
      currentLocation: "Delivered",
      statusHistory: [
        {
          status: "order_placed",
          timestamp: "2024-01-15T10:30:00Z",
          location: "Order Processing Center",
          description: "Your order has been placed successfully",
        },
        {
          status: "confirmed",
          timestamp: "2024-01-15T11:15:00Z",
          location: "Order Processing Center",
          description: "Order confirmed and payment received",
        },
        {
          status: "packed",
          timestamp: "2024-01-16T09:20:00Z",
          location: "Warehouse",
          description: "Your order has been packed and is ready for dispatch",
        },
        {
          status: "shipped",
          timestamp: "2024-01-16T16:45:00Z",
          location: "Warehouse",
          description: "Your order has been shipped via Blue Dart",
        },
        {
          status: "in_transit",
          timestamp: "2024-01-17T08:30:00Z",
          location: "Delhi Hub",
          description: "Your order is in transit to Gurgaon",
        },
        {
          status: "out_for_delivery",
          timestamp: "2024-01-18T09:00:00Z",
          location: "Gurgaon Hub",
          description: "Your order is out for delivery",
        },
        {
          status: "delivered",
          timestamp: "2024-01-18T14:20:00Z",
          location: "Gurgaon",
          description: "Your order has been delivered successfully",
        },
      ],
    },
  },
  {
    id: "ORD002",
    orderNumber: "ORD-2024-002",
    customerPhone: "+919876543210",
    customerName: "John Doe",
    status: "shipped",
    orderDate: "2024-01-20T14:15:00Z",
    deliveryDate: null,
    totalAmount: 24990,
    items: [
      {
        productId: "EC005",
        productName: "Sony WH-1000XM5",
        quantity: 1,
        price: 24990,
      },
    ],
    shippingAddress: {
      name: "John Doe",
      address: "123 Main Street, Sector 29",
      city: "Gurgaon",
      state: "Haryana",
      pincode: "122001",
      phone: "+919876543210",
    },
    trackingInfo: {
      trackingNumber: "TRK987654321",
      carrier: "DTDC",
      estimatedDelivery: "2024-01-23T18:00:00Z",
      currentLocation: "Delhi Hub",
      statusHistory: [
        {
          status: "order_placed",
          timestamp: "2024-01-20T14:15:00Z",
          location: "Order Processing Center",
          description: "Your order has been placed successfully",
        },
        {
          status: "confirmed",
          timestamp: "2024-01-20T15:00:00Z",
          location: "Order Processing Center",
          description: "Order confirmed and payment received",
        },
        {
          status: "packed",
          timestamp: "2024-01-21T10:30:00Z",
          location: "Warehouse",
          description: "Your order has been packed and is ready for dispatch",
        },
        {
          status: "shipped",
          timestamp: "2024-01-21T16:20:00Z",
          location: "Warehouse",
          description: "Your order has been shipped via DTDC",
        },
        {
          status: "in_transit",
          timestamp: "2024-01-22T12:00:00Z",
          location: "Delhi Hub",
          description: "Your order is in transit to Gurgaon",
        },
      ],
    },
  },
];

/**
 * Track order status and location
 */
async function execute(parameters, context = {}) {
  try {
    const { order_id, phone_number } = parameters;

    logger.info("Tracking order", { parameters });

    // Find order by ID or order number
    let order = null;

    if (order_id) {
      // Try to find by order ID first
      order = mockOrders.find((o) => o.id === order_id);

      // If not found, try by order number
      if (!order) {
        order = mockOrders.find((o) => o.orderNumber === order_id);
      }

      // If still not found, try by tracking number
      if (!order) {
        order = mockOrders.find(
          (o) => o.trackingInfo.trackingNumber === order_id
        );
      }
    }

    if (!order) {
      return {
        success: false,
        error: "Order not found",
        response:
          "I couldn't find any order with that ID. Please check your order number or tracking ID and try again.",
      };
    }

    // Verify phone number if provided
    if (phone_number && order.customerPhone !== phone_number) {
      return {
        success: false,
        error: "Phone number mismatch",
        response:
          "The phone number doesn't match our records for this order. Please verify your phone number.",
      };
    }

    // Format response
    const response = formatOrderTracking(order);

    return {
      success: true,
      result: {
        order: order,
        trackingInfo: order.trackingInfo,
        currentStatus: order.status,
      },
      response: response,
    };
  } catch (error) {
    logger.error("Order tracking failed", { error: error.message, parameters });
    return {
      success: false,
      error: error.message,
      response:
        "I encountered an error while tracking your order. Please try again.",
    };
  }
}

/**
 * Format order tracking information
 */
function formatOrderTracking(order) {
  const statusEmoji = getStatusEmoji(order.status);
  const deliveryDate = order.deliveryDate
    ? formatDate(order.deliveryDate)
    : "Not delivered yet";
  const estimatedDelivery = order.trackingInfo.estimatedDelivery
    ? formatDate(order.trackingInfo.estimatedDelivery)
    : "Not available";

  let response = `${statusEmoji} **Order Tracking Information**\n\n`;
  response += `📋 **Order Details:**\n`;
  response += `🆔 Order ID: ${order.orderNumber}\n`;
  response += `📅 Order Date: ${formatDate(order.orderDate)}\n`;
  response += `💰 Total Amount: ₹${order.totalAmount.toLocaleString(
    "en-IN"
  )}\n`;
  response += `📦 Status: ${getStatusText(order.status)}\n\n`;

  response += `🚚 **Shipping Information:**\n`;
  response += `📦 Tracking Number: ${order.trackingInfo.trackingNumber}\n`;
  response += `🚛 Carrier: ${order.trackingInfo.carrier}\n`;
  response += `📍 Current Location: ${order.trackingInfo.currentLocation}\n`;
  response += `📅 Estimated Delivery: ${estimatedDelivery}\n`;

  if (order.deliveryDate) {
    response += `✅ Delivered On: ${deliveryDate}\n`;
  }

  response += `\n📦 **Order Items:**\n`;
  order.items.forEach((item, index) => {
    response += `${index + 1}. ${item.productName} (Qty: ${
      item.quantity
    }) - ₹${item.price.toLocaleString("en-IN")}\n`;
  });

  response += `\n📍 **Delivery Address:**\n`;
  response += `${order.shippingAddress.name}\n`;
  response += `${order.shippingAddress.address}\n`;
  response += `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}\n`;
  response += `📞 ${order.shippingAddress.phone}\n\n`;

  // Add status history
  response += `📈 **Status History:**\n`;
  order.trackingInfo.statusHistory.slice(-3).forEach((status) => {
    const emoji = getStatusEmoji(status.status);
    const time = formatDateTime(status.timestamp);
    response += `${emoji} ${time}: ${status.description}\n`;
  });

  if (order.trackingInfo.statusHistory.length > 3) {
    response += `... and ${
      order.trackingInfo.statusHistory.length - 3
    } more updates\n`;
  }

  // Add helpful actions
  response += `\n💡 **What you can do:**\n`;
  if (order.status === "delivered") {
    response += `• Rate your purchase experience\n`;
    response += `• Initiate return if needed (within return policy)\n`;
    response += `• Buy similar products\n`;
  } else if (order.status === "shipped" || order.status === "in_transit") {
    response += `• Track real-time location on carrier website\n`;
    response += `• Contact carrier for delivery updates\n`;
    response += `• Reschedule delivery if needed\n`;
  } else if (order.status === "pending" || order.status === "confirmed") {
    response += `• Cancel order if needed\n`;
    response += `• Modify delivery address\n`;
    response += `• Contact support for assistance\n`;
  }

  return response;
}

/**
 * Get status emoji
 */
function getStatusEmoji(status) {
  const statusEmojis = {
    order_placed: "📝",
    confirmed: "✅",
    packed: "📦",
    shipped: "🚚",
    in_transit: "🚛",
    out_for_delivery: "🚚",
    delivered: "✅",
    cancelled: "❌",
    returned: "🔄",
  };

  return statusEmojis[status] || "📋";
}

/**
 * Get status text
 */
function getStatusText(status) {
  const statusTexts = {
    order_placed: "Order Placed",
    confirmed: "Confirmed",
    packed: "Packed",
    shipped: "Shipped",
    in_transit: "In Transit",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
  };

  return statusTexts[status] || status;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format date and time for display
 */
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get order by ID
 */
function getOrderById(orderId) {
  return mockOrders.find(
    (order) => order.id === orderId || order.orderNumber === orderId
  );
}

/**
 * Get orders by customer phone
 */
function getOrdersByCustomer(phoneNumber) {
  return mockOrders.filter((order) => order.customerPhone === phoneNumber);
}

/**
 * Update order status
 */
function updateOrderStatus(
  orderId,
  newStatus,
  location = null,
  description = null
) {
  const order = getOrderById(orderId);
  if (order) {
    order.status = newStatus;

    if (location) {
      order.trackingInfo.currentLocation = location;
    }

    if (description) {
      order.trackingInfo.statusHistory.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        location: location || order.trackingInfo.currentLocation,
        description: description,
      });
    }

    return true;
  }
  return false;
}

module.exports = {
  execute,
  getOrderById,
  getOrdersByCustomer,
  updateOrderStatus,
};
