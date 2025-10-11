const logger = require("../../../config/logger");

// Mock product database
const mockProducts = [
  {
    id: "EC001",
    name: "iPhone 15 Pro",
    category: "electronics",
    subcategory: "smartphones",
    brand: "Apple",
    price: 134900,
    originalPrice: 139900,
    discount: 5000,
    rating: 4.8,
    reviews: 1250,
    stock: 15,
    images: ["https://example.com/iphone15pro.jpg"],
    description:
      "Latest iPhone with A17 Pro chip, titanium design, and advanced camera system",
    specifications: {
      Display: "6.1-inch Super Retina XDR",
      Storage: "128GB",
      Camera: "48MP Main + 12MP Ultra Wide",
      Battery: "Up to 23 hours video playback",
      Color: "Natural Titanium",
    },
    features: ["5G", "Face ID", "Wireless Charging", "Water Resistant"],
    seller: "Apple Store",
    deliveryTime: "2-3 days",
    returnPolicy: "14 days return policy",
  },
  {
    id: "EC002",
    name: "Samsung Galaxy S24",
    category: "electronics",
    subcategory: "smartphones",
    brand: "Samsung",
    price: 79999,
    originalPrice: 89999,
    discount: 10000,
    rating: 4.6,
    reviews: 890,
    stock: 25,
    images: ["https://example.com/galaxys24.jpg"],
    description:
      "Premium Android smartphone with AI-powered features and stunning display",
    specifications: {
      Display: "6.2-inch Dynamic AMOLED 2X",
      Storage: "256GB",
      Camera: "50MP Main + 12MP Ultra Wide",
      Battery: "4000mAh",
      Color: "Titanium Gray",
    },
    features: ["5G", "Wireless Charging", "S Pen Support", "Water Resistant"],
    seller: "Samsung Store",
    deliveryTime: "1-2 days",
    returnPolicy: "15 days return policy",
  },
  {
    id: "EC003",
    name: "Nike Air Max 270",
    category: "clothing",
    subcategory: "shoes",
    brand: "Nike",
    price: 12995,
    originalPrice: 14995,
    discount: 2000,
    rating: 4.4,
    reviews: 567,
    stock: 40,
    images: ["https://example.com/nikeairmax.jpg"],
    description:
      "Comfortable running shoes with Max Air cushioning and breathable upper",
    specifications: {
      Size: "Available in 6-12",
      Color: "Black/White",
      Material: "Mesh and Synthetic",
      Weight: "320g",
      Type: "Running Shoes",
    },
    features: ["Air Max Cushioning", "Breathable Upper", "Durable Outsole"],
    seller: "Nike Official",
    deliveryTime: "3-5 days",
    returnPolicy: "30 days return policy",
  },
  {
    id: "EC004",
    name: "MacBook Air M2",
    category: "electronics",
    subcategory: "laptops",
    brand: "Apple",
    price: 99900,
    originalPrice: 109900,
    discount: 10000,
    rating: 4.9,
    reviews: 234,
    stock: 8,
    images: ["https://example.com/macbookair.jpg"],
    description:
      "Ultra-thin laptop with M2 chip, all-day battery life, and stunning Liquid Retina display",
    specifications: {
      Display: "13.6-inch Liquid Retina",
      Processor: "Apple M2 chip",
      Storage: "256GB SSD",
      Memory: "8GB Unified Memory",
      Color: "Space Gray",
    },
    features: ["M2 Chip", "All-day Battery", "Touch ID", "Backlit Keyboard"],
    seller: "Apple Store",
    deliveryTime: "2-3 days",
    returnPolicy: "14 days return policy",
  },
  {
    id: "EC005",
    name: "Sony WH-1000XM5",
    category: "electronics",
    subcategory: "headphones",
    brand: "Sony",
    price: 24990,
    originalPrice: 29990,
    discount: 5000,
    rating: 4.7,
    reviews: 445,
    stock: 20,
    images: ["https://example.com/sonyheadphones.jpg"],
    description:
      "Industry-leading noise canceling wireless headphones with exceptional sound quality",
    specifications: {
      Type: "Over-ear Wireless",
      Battery: "30 hours playback",
      Connectivity: "Bluetooth 5.2",
      Weight: "250g",
      Color: "Black",
    },
    features: [
      "Active Noise Cancellation",
      "30hr Battery",
      "Quick Charge",
      "Touch Controls",
    ],
    seller: "Sony Store",
    deliveryTime: "2-4 days",
    returnPolicy: "15 days return policy",
  },
];

/**
 * Search products based on criteria
 */
async function execute(parameters, context = {}) {
  try {
    const { query, category, brand, min_price, max_price, sort_by } =
      parameters;

    logger.info("Searching products", { parameters });

    // Filter products based on criteria
    let filteredProducts = mockProducts;

    // Filter by search query
    if (query) {
      const queryLower = query.toLowerCase();
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(queryLower) ||
          product.description.toLowerCase().includes(queryLower) ||
          product.brand.toLowerCase().includes(queryLower) ||
          product.category.toLowerCase().includes(queryLower)
      );
    }

    // Filter by category
    if (category) {
      const categoryLower = category.toLowerCase();
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.category.toLowerCase().includes(categoryLower) ||
          product.subcategory.toLowerCase().includes(categoryLower)
      );
    }

    // Filter by brand
    if (brand) {
      const brandLower = brand.toLowerCase();
      filteredProducts = filteredProducts.filter((product) =>
        product.brand.toLowerCase().includes(brandLower)
      );
    }

    // Filter by price range
    if (min_price) {
      filteredProducts = filteredProducts.filter(
        (product) => product.price >= min_price
      );
    }

    if (max_price) {
      filteredProducts = filteredProducts.filter(
        (product) => product.price <= max_price
      );
    }

    // Sort products
    if (sort_by) {
      switch (sort_by.toLowerCase()) {
        case "price":
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case "price_desc":
          filteredProducts.sort((a, b) => b.price - a.price);
          break;
        case "rating":
          filteredProducts.sort((a, b) => b.rating - a.rating);
          break;
        case "popularity":
          filteredProducts.sort((a, b) => b.reviews - a.reviews);
          break;
        case "newest":
          // Mock newest sorting - in real app, use creation date
          filteredProducts.sort((a, b) => b.id.localeCompare(a.id));
          break;
        default:
          // Default sorting by relevance (rating * reviews)
          filteredProducts.sort(
            (a, b) => b.rating * b.reviews - a.rating * a.reviews
          );
      }
    } else {
      // Default sorting by relevance
      filteredProducts.sort(
        (a, b) => b.rating * b.reviews - a.rating * a.reviews
      );
    }

    // Limit results
    const maxResults = 8;
    const results = filteredProducts.slice(0, maxResults);

    if (results.length === 0) {
      return {
        success: true,
        result: "No products found matching your criteria.",
        response:
          "I couldn't find any products matching your search. Please try different keywords, adjust your price range, or browse by category.",
      };
    }

    // Format response
    const response = formatProductResults(results, parameters);

    return {
      success: true,
      result: {
        products: results,
        totalFound: results.length,
        searchCriteria: parameters,
      },
      response: response,
    };
  } catch (error) {
    logger.error("Product search failed", { error: error.message, parameters });
    return {
      success: false,
      error: error.message,
      response:
        "I encountered an error while searching for products. Please try again.",
    };
  }
}

/**
 * Format product search results
 */
function formatProductResults(products, searchCriteria) {
  let response = `🛒 Found ${products.length} products matching your search:\n\n`;

  products.forEach((product, index) => {
    const discountPercent = product.discount
      ? Math.round((product.discount / product.originalPrice) * 100)
      : 0;

    response += `${index + 1}. **${product.name}**\n`;
    response += `🏷️ ${product.brand} | ${
      product.category.charAt(0).toUpperCase() + product.category.slice(1)
    }\n`;
    response += `💰 ₹${product.price.toLocaleString("en-IN")}`;

    if (product.discount > 0) {
      response += ` (${discountPercent}% OFF)`;
    }

    response += `\n⭐ ${product.rating}/5 (${product.reviews} reviews)\n`;
    response += `📦 In Stock: ${product.stock} units\n`;
    response += `🚚 Delivery: ${product.deliveryTime}\n`;
    response += `📝 ${product.description.substring(0, 100)}...\n\n`;
  });

  response += `💡 **To get more details:**\n`;
  response += `• Say "Show me details of [product name]" or "Tell me about product [ID]"\n`;
  response += `• Say "Add [product name] to cart" to add to shopping cart\n`;
  response += `• Say "Check availability of [product name]" for stock info\n\n`;

  response += `🔄 **To refine your search:**\n`;
  response += `• Add price range: "under ₹50,000" or "between ₹10,000-20,000"\n`;
  response += `• Filter by brand: "Samsung phones" or "Nike shoes"\n`;
  response += `• Sort by: "sort by price" or "sort by rating"`;

  return response;
}

/**
 * Get product by ID
 */
function getProductById(productId) {
  return mockProducts.find((product) => product.id === productId);
}

/**
 * Get products by category
 */
function getProductsByCategory(category) {
  return mockProducts.filter((product) =>
    product.category.toLowerCase().includes(category.toLowerCase())
  );
}

/**
 * Get products by brand
 */
function getProductsByBrand(brand) {
  return mockProducts.filter((product) =>
    product.brand.toLowerCase().includes(brand.toLowerCase())
  );
}

/**
 * Get featured products
 */
function getFeaturedProducts(limit = 5) {
  return mockProducts
    .filter((product) => product.discount > 0) // Products with discount
    .sort((a, b) => b.rating - a.rating) // Sort by rating
    .slice(0, limit);
}

/**
 * Get trending products
 */
function getTrendingProducts(limit = 5) {
  return mockProducts
    .sort((a, b) => b.reviews - a.reviews) // Sort by number of reviews
    .slice(0, limit);
}

module.exports = {
  execute,
  getProductById,
  getProductsByCategory,
  getProductsByBrand,
  getFeaturedProducts,
  getTrendingProducts,
};
