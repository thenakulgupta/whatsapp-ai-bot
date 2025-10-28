const express = require("express");
const router = express.Router();

const products = [
  // 👕 Clothing
  {
    id: 1,
    name: "Classic Cotton T-Shirt",
    category: "Clothing",
    description: "A comfortable 100% cotton T-shirt perfect for everyday wear.",
    shortDescription: "Soft cotton T-shirt for daily comfort.",
    totalPrice: 25,
    salePrice: 19.99,
  },
  {
    id: 2,
    name: "Slim Fit Jeans",
    category: "Clothing",
    description:
      "Stylish slim-fit jeans made with stretchable denim for comfort and flexibility.",
    shortDescription: "Slim-fit stretch jeans.",
    totalPrice: 60,
    salePrice: 49.99,
  },
  {
    id: 3,
    name: "Lightweight Hoodie",
    category: "Clothing",
    description:
      "A lightweight hoodie with a front pocket and adjustable drawstring.",
    shortDescription: "Everyday casual hoodie.",
    totalPrice: 45,
    salePrice: 39.99,
  },

  // 💻 Electronics
  {
    id: 4,
    name: "Wireless Bluetooth Headphones",
    category: "Electronics",
    description:
      "Noise-cancelling over-ear headphones with 30-hour battery life.",
    shortDescription: "Wireless noise-cancelling headphones.",
    totalPrice: 150,
    salePrice: 129.99,
  },
  {
    id: 5,
    name: "4K Ultra HD Smart TV",
    category: "Electronics",
    description:
      "55-inch smart TV with HDR, Dolby Vision, and voice control support.",
    shortDescription: "55-inch 4K HDR Smart TV.",
    totalPrice: 699,
    salePrice: 599,
  },
  {
    id: 6,
    name: "Portable Bluetooth Speaker",
    category: "Electronics",
    description:
      "Compact waterproof speaker with deep bass and 12-hour battery life.",
    shortDescription: "Portable waterproof speaker.",
    totalPrice: 89,
    salePrice: 69.99,
  },

  // 👟 Footwear
  {
    id: 7,
    name: "Running Shoes",
    category: "Footwear",
    description:
      "Lightweight running shoes with breathable mesh and durable outsole.",
    shortDescription: "Breathable lightweight runners.",
    totalPrice: 120,
    salePrice: 99.99,
  },
  {
    id: 8,
    name: "Leather Loafers",
    category: "Footwear",
    description: "Premium leather loafers ideal for formal or casual wear.",
    shortDescription: "Elegant leather loafers.",
    totalPrice: 140,
    salePrice: 119.99,
  },
  {
    id: 9,
    name: "Casual Sneakers",
    category: "Footwear",
    description:
      "Stylish low-top sneakers with cushioned insoles for all-day comfort.",
    shortDescription: "Comfortable everyday sneakers.",
    totalPrice: 80,
    salePrice: 69.99,
  },

  // 🕶️ Accessories
  {
    id: 10,
    name: "Aviator Sunglasses",
    category: "Accessories",
    description:
      "Classic aviator sunglasses with UV400 protection and metal frame.",
    shortDescription: "Stylish UV-protected aviators.",
    totalPrice: 70,
    salePrice: 54.99,
  },
  {
    id: 11,
    name: "Leather Wallet",
    category: "Accessories",
    description: "Genuine leather bifold wallet with RFID-blocking technology.",
    shortDescription: "Compact RFID-blocking wallet.",
    totalPrice: 45,
    salePrice: 34.99,
  },
  {
    id: 12,
    name: "Analog Wrist Watch",
    category: "Accessories",
    description:
      "Elegant analog wristwatch with stainless steel strap and quartz movement.",
    shortDescription: "Stainless steel analog watch.",
    totalPrice: 150,
    salePrice: 129.99,
  },

  // 🏠 Home & Kitchen
  {
    id: 13,
    name: "Ceramic Dinner Set",
    category: "Home & Kitchen",
    description: "16-piece ceramic dinner set with a sleek modern design.",
    shortDescription: "16-piece ceramic dinnerware set.",
    totalPrice: 85,
    salePrice: 69.99,
  },
  {
    id: 14,
    name: "Non-Stick Frying Pan",
    category: "Home & Kitchen",
    description: "Durable non-stick frying pan with heat-resistant handle.",
    shortDescription: "Premium non-stick frying pan.",
    totalPrice: 40,
    salePrice: 29.99,
  },
  {
    id: 15,
    name: "Electric Kettle",
    category: "Home & Kitchen",
    description:
      "1.7L stainless steel electric kettle with auto shut-off function.",
    shortDescription: "Fast-boil stainless kettle.",
    totalPrice: 55,
    salePrice: 44.99,
  },

  // 🧴 Beauty & Personal Care
  {
    id: 16,
    name: "Hydrating Face Serum",
    category: "Beauty & Personal Care",
    description:
      "Vitamin C and hyaluronic acid serum for glowing, hydrated skin.",
    shortDescription: "Hydrating Vitamin C serum.",
    totalPrice: 35,
    salePrice: 27.99,
  },
  {
    id: 17,
    name: "Organic Shampoo",
    category: "Beauty & Personal Care",
    description:
      "Sulfate-free shampoo made with organic aloe vera and green tea extracts.",
    shortDescription: "Gentle organic shampoo.",
    totalPrice: 22,
    salePrice: 17.99,
  },
  {
    id: 18,
    name: "Beard Grooming Kit",
    category: "Beauty & Personal Care",
    description: "Complete grooming kit with beard oil, balm, and comb.",
    shortDescription: "3-piece beard care set.",
    totalPrice: 50,
    salePrice: 39.99,
  },

  // 📚 Books
  {
    id: 19,
    name: "The Art of Productivity",
    category: "Books",
    description:
      "A bestselling self-help book that teaches time management and focus techniques.",
    shortDescription: "Self-help productivity guide.",
    totalPrice: 25,
    salePrice: 19.99,
  },
  {
    id: 20,
    name: "Modern Cooking Essentials",
    category: "Books",
    description:
      "A cookbook with 200+ modern recipes and kitchen tips for home chefs.",
    shortDescription: "Comprehensive modern cookbook.",
    totalPrice: 40,
    salePrice: 32.99,
  },
];

const orders = [
  {
    orderId: "ORD-1001",
    orderDate: "2025-10-01",
    status: "Delivered",
    paymentMethod: "Credit Card",
    shippingAddress: "123 Main St, New York, NY, USA",
    items: [
      {
        productId: 1,
        name: "Classic Cotton T-Shirt",
        quantity: 2,
        price: 19.99,
        subtotal: 39.98,
      },
      {
        productId: 2,
        name: "Slim Fit Jeans",
        quantity: 1,
        price: 49.99,
        subtotal: 49.99,
      },
    ],
    totalAmount: 89.97,
  },
  {
    orderId: "ORD-1002",
    orderDate: "2025-10-02",
    status: "Processing",
    paymentMethod: "PayPal",
    shippingAddress: "456 Oak Street, Los Angeles, CA, USA",
    items: [
      {
        productId: 4,
        name: "Wireless Bluetooth Headphones",
        quantity: 1,
        price: 129.99,
        subtotal: 129.99,
      },
      {
        productId: 7,
        name: "Running Shoes",
        quantity: 1,
        price: 99.99,
        subtotal: 99.99,
      },
    ],
    totalAmount: 229.98,
  },
  {
    orderId: "ORD-1003",
    orderDate: "2025-10-03",
    status: "Shipped",
    paymentMethod: "Debit Card",
    shippingAddress: "789 Pine Avenue, Austin, TX, USA",
    items: [
      {
        productId: 5,
        name: "4K Ultra HD Smart TV",
        quantity: 1,
        price: 599,
        subtotal: 599,
      },
    ],
    totalAmount: 599,
  },
  {
    orderId: "ORD-1004",
    orderDate: "2025-10-04",
    status: "Delivered",
    paymentMethod: "Credit Card",
    shippingAddress: "234 Maple Drive, Chicago, IL, USA",
    items: [
      {
        productId: 16,
        name: "Hydrating Face Serum",
        quantity: 2,
        price: 27.99,
        subtotal: 55.98,
      },
      {
        productId: 17,
        name: "Organic Shampoo",
        quantity: 1,
        price: 17.99,
        subtotal: 17.99,
      },
    ],
    totalAmount: 73.97,
  },
  {
    orderId: "ORD-1005",
    orderDate: "2025-10-05",
    status: "Cancelled",
    paymentMethod: "Credit Card",
    shippingAddress: "901 Cedar Blvd, Seattle, WA, USA",
    items: [
      {
        productId: 10,
        name: "Aviator Sunglasses",
        quantity: 1,
        price: 54.99,
        subtotal: 54.99,
      },
    ],
    totalAmount: 54.99,
  },
  {
    orderId: "ORD-1006",
    orderDate: "2025-10-06",
    status: "Delivered",
    paymentMethod: "UPI",
    shippingAddress: "12 Rosewood Lane, Denver, CO, USA",
    items: [
      {
        productId: 9,
        name: "Casual Sneakers",
        quantity: 1,
        price: 69.99,
        subtotal: 69.99,
      },
      {
        productId: 12,
        name: "Analog Wrist Watch",
        quantity: 1,
        price: 129.99,
        subtotal: 129.99,
      },
    ],
    totalAmount: 199.98,
  },
  {
    orderId: "ORD-1007",
    orderDate: "2025-10-08",
    status: "Pending",
    paymentMethod: "Cash on Delivery",
    shippingAddress: "450 Elm Street, Miami, FL, USA",
    items: [
      {
        productId: 3,
        name: "Lightweight Hoodie",
        quantity: 1,
        price: 39.99,
        subtotal: 39.99,
      },
      {
        productId: 8,
        name: "Leather Loafers",
        quantity: 1,
        price: 119.99,
        subtotal: 119.99,
      },
    ],
    totalAmount: 159.98,
  },
  {
    orderId: "ORD-1008",
    orderDate: "2025-10-09",
    status: "Delivered",
    paymentMethod: "Credit Card",
    shippingAddress: "789 Palm Avenue, San Diego, CA, USA",
    items: [
      {
        productId: 15,
        name: "Electric Kettle",
        quantity: 1,
        price: 44.99,
        subtotal: 44.99,
      },
      {
        productId: 14,
        name: "Non-Stick Frying Pan",
        quantity: 1,
        price: 29.99,
        subtotal: 29.99,
      },
    ],
    totalAmount: 74.98,
  },
  {
    orderId: "ORD-1009",
    orderDate: "2025-10-10",
    status: "Delivered",
    paymentMethod: "PayPal",
    shippingAddress: "54 Willow Road, Boston, MA, USA",
    items: [
      {
        productId: 19,
        name: "The Art of Productivity",
        quantity: 1,
        price: 19.99,
        subtotal: 19.99,
      },
      {
        productId: 20,
        name: "Modern Cooking Essentials",
        quantity: 1,
        price: 32.99,
        subtotal: 32.99,
      },
    ],
    totalAmount: 52.98,
  },
  {
    orderId: "ORD-1010",
    orderDate: "2025-10-12",
    status: "Shipped",
    paymentMethod: "Credit Card",
    shippingAddress: "67 Birchwood Crescent, Houston, TX, USA",
    items: [
      {
        productId: 6,
        name: "Portable Bluetooth Speaker",
        quantity: 2,
        price: 69.99,
        subtotal: 139.98,
      },
    ],
    totalAmount: 139.98,
  },
];

/**
 * Get overall analytics
 */
router.get("/", async (req, res) => {
  res.json({
    message: "Hello World",
  });
});

router.get("/search", async (req, res) => {
  const { query } = req.query;
  res.json({
    data: products.filter((product) =>
      product.name?.toLowerCase().includes(query?.toLowerCase())
    ),
  });
});

router.get("/get-product-details", async (req, res) => {
  const { product_id } = req.query;
  res.json({
    data: products.find((product) => product.id === parseInt(product_id)),
  });
});

router.get("/track-order", async (req, res) => {
  const { order_id } = req.query;
  res.json({
    data: orders.find((order) => order.orderId === order_id),
  });
});

router.get("/cancel-order", async (req, res) => {
  const { order_id } = req.query;
  res.json({
    data: orders.find((order) => order.orderId === order_id),
  });
});

router.get("/initiate-return", async (req, res) => {
  const { order_id, product_id, reason, return_type } = req.query;
  res.json({
    data: orders.find((order) => order.orderId === order_id),
  });
});

router.get("/get-order-history", async (req, res) => {
  const { date_range, status } = req.query;
  res.json({
    data: orders.filter(
      (order) => order.orderDate >= date_range && order.status === status
    ),
  });
});

router.get("/add-to-cart", async (req, res) => {
  const { product_id, quantity, variant } = req.query;
  res.json({
    data: "Product added to cart",
  });
});

router.get("/get-cart", async (req, res) => {
  const { cart_id } = req.query;
  res.json({
    data: "Cart",
  });
});

router.get("/apply-coupon", async (req, res) => {
  const { coupon_code, order_id } = req.query;
  res.json({
    data: "Coupon applied",
  });
});

router.get("/check-availability", async (req, res) => {
  const { product_id, pincode, quantity } = req.query;
  res.json({
    data: products.find((product) => product.id === parseInt(product_id)),
  });
});

module.exports = router;
