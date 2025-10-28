module.exports = {
  name: "E-Commerce",
  description:
    "Browse products, track orders, manage returns, and get shopping assistance",
  icon: "🛒",
  welcomeMessage:
    'Welcome to our E-Commerce demo! I can help you browse products, track orders, manage returns, and answer shopping questions. Try saying "Show me smartphones under ₹20,000" or "Track my order #12345".',
  exitMessage:
    'Thank you for shopping with us! Type "exit" to return to the main menu.',

  functions: [
    {
      name: "search_products",
      description:
        "Search for products by category, brand, price range, or keywords",
      parameters: {
        query: { type: "string", description: "Search query or product name" },
        category: {
          type: "string",
          description: "Product category (electronics, clothing, books, etc.)",
        },
        brand: { type: "string", description: "Brand name" },
        min_price: { type: "number", description: "Minimum price" },
        max_price: { type: "number", description: "Maximum price" },
        sort_by: {
          type: "string",
          description: "Sort by (price, rating, popularity, newest)",
        },
      },
      required: ["query"],
      examples: [
        "Show me smartphones under ₹20,000",
        "Find Nike running shoes",
        "Search for laptops in electronics category",
      ],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/ecommerce/search",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          query: "string",
        },
      },
    },
    {
      name: "get_product_details",
      description: "Get detailed information about a specific product",
      parameters: {
        product_id: { type: "string", description: "Product ID or SKU" },
        product_name: { type: "string", description: "Product name" },
      },
      required: ["product_id"],
      examples: [
        "Show me details of product ABC123",
        "Tell me about iPhone 15 Pro",
      ],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/ecommerce/get-product-details",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          product_id: "string",
        },
      },
    },
    {
      name: "track_order",
      description: "Track the status and location of an order",
      parameters: {
        order_id: {
          type: "string",
          description: "Order ID or tracking number",
        },
      },
      required: ["order_id"],
      examples: ["Track my order #12345", "Where is my order ORD789?"],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/ecommerce/track-order",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          order_id: "string",
        },
      },
    },
    {
      name: "cancel_order",
      description: "Cancel a pending order",
      parameters: {
        order_id: { type: "string", description: "Order ID to cancel" },
        reason: { type: "string", description: "Reason for cancellation" },
      },
      required: ["order_id"],
      examples: [
        "Cancel my order #12345",
        "Cancel order ORD789 because I changed my mind",
      ],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/ecommerce/cancel-order",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          order_id: "string",
        },
      },
    },
    {
      name: "initiate_return",
      description: "Initiate a return or exchange for a product",
      parameters: {
        order_id: { type: "string", description: "Order ID" },
        product_id: { type: "string", description: "Product ID to return" },
        reason: { type: "string", description: "Reason for return" },
        return_type: {
          type: "string",
          description: "Return type (refund, exchange)",
        },
      },
      required: ["order_id", "product_id"],
      examples: [
        "I want to return product ABC123 from order #12345",
        "Initiate exchange for defective item",
      ],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/ecommerce/initiate-return",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          order_id: "string",
          product_id: "string",
          reason: "string",
          return_type: "string",
        },
      },
    },
    {
      name: "get_order_history",
      description: "Get order history for a customer",
      parameters: {
        date_range: {
          type: "string",
          description: "Date range (last_month, last_3_months, last_year)",
        },
        status: {
          type: "string",
          description: "Order status filter (delivered, pending, cancelled)",
        },
      },
      examples: ["Show my order history", "Get my orders from last month"],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/ecommerce/get-order-history",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          date_range: "string",
          status: "string",
        },
      },
    },
    {
      name: "add_to_cart",
      description: "Add a product to shopping cart",
      parameters: {
        product_id: { type: "string", description: "Product ID" },
        quantity: { type: "number", description: "Quantity to add" },
        variant: {
          type: "string",
          description: "Product variant (size, color, etc.)",
        },
      },
      required: ["product_id"],
      examples: [
        "Add iPhone 15 to cart",
        "Add 2 units of product ABC123 to cart",
      ],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/ecommerce/add-to-cart",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          product_id: "string",
          quantity: "number",
          variant: "string",
        },
      },
    },
    {
      name: "get_cart",
      description: "View items in shopping cart",
      examples: ["Show my cart", "What's in my shopping cart?"],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/ecommerce/get-cart",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          cart_id: "string",
        },
      },
    },
    {
      name: "apply_coupon",
      description: "Apply a discount coupon to cart or order",
      parameters: {
        coupon_code: { type: "string", description: "Coupon code" },
        order_id: {
          type: "string",
          description: "Order ID (for existing orders)",
        },
      },
      required: ["coupon_code"],
      examples: ["Apply coupon SAVE20", "Use discount code WELCOME10"],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/ecommerce/apply-coupon",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          coupon_code: "string",
          order_id: "string",
        },
      },
    },
    {
      name: "check_availability",
      description: "Check product availability and stock",
      parameters: {
        product_id: { type: "string", description: "Product ID" },
        pincode: { type: "string", description: "Delivery pincode" },
        quantity: { type: "number", description: "Required quantity" },
      },
      required: ["product_id"],
      examples: [
        "Check if iPhone 15 is available",
        "Is product ABC123 in stock?",
      ],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/ecommerce/check-availability",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          product_id: "string",
          pincode: "string",
          quantity: "number",
        },
      },
    },
  ],

  config: {
    currency: "INR",
    supportedCategories: [
      "electronics",
      "clothing",
      "books",
      "home",
      "beauty",
      "sports",
      "automotive",
    ],
    popularBrands: [
      "Apple",
      "Samsung",
      "Nike",
      "Adidas",
      "Amazon",
      "Sony",
      "LG",
    ],
    orderStatuses: [
      "pending",
      "confirmed",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "returned",
    ],
    returnReasons: [
      "defective",
      "wrong_item",
      "size_issue",
      "changed_mind",
      "damaged_delivery",
    ],
    maxCartItems: 50,
    defaultDeliveryDays: 3,
    freeShippingThreshold: 500,
  },
};
