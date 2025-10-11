const logger = require("../../../config/logger");

// Mock property database
const mockProperties = [
  {
    id: "RE001",
    name: "Green Valley Apartments",
    location: "Gurgaon",
    area: "Sector 29",
    price: "45L",
    priceNumeric: 4500000,
    bedrooms: "2BHK",
    propertyType: "flat",
    size: "1200 sq ft",
    amenities: ["Swimming Pool", "Gym", "Parking", "Security"],
    images: ["https://example.com/property1.jpg"],
    description: "Beautiful 2BHK flat in prime location with modern amenities",
    builder: "ABC Builders",
    possession: "Ready to Move",
    floor: "5th Floor",
    facing: "North",
    age: "2 years",
  },
  {
    id: "RE002",
    name: "Royal Gardens",
    location: "Gurgaon",
    area: "Sector 45",
    price: "55L",
    priceNumeric: 5500000,
    bedrooms: "3BHK",
    propertyType: "flat",
    size: "1500 sq ft",
    amenities: ["Swimming Pool", "Gym", "Parking", "Security", "Garden"],
    images: ["https://example.com/property2.jpg"],
    description: "Spacious 3BHK flat with premium amenities",
    builder: "XYZ Developers",
    possession: "Under Construction",
    floor: "8th Floor",
    facing: "South",
    age: "New",
  },
  {
    id: "RE003",
    name: "Luxury Villa",
    location: "Gurgaon",
    area: "DLF Phase 2",
    price: "2.5Cr",
    priceNumeric: 25000000,
    bedrooms: "4BHK",
    propertyType: "villa",
    size: "3500 sq ft",
    amenities: [
      "Private Garden",
      "Swimming Pool",
      "Parking",
      "Security",
      "Maid Room",
    ],
    images: ["https://example.com/property3.jpg"],
    description: "Luxury villa with private amenities",
    builder: "Premium Builders",
    possession: "Ready to Move",
    floor: "Ground Floor",
    facing: "East",
    age: "1 year",
  },
  {
    id: "RE004",
    name: "Modern Heights",
    location: "Delhi",
    area: "Dwarka",
    price: "65L",
    priceNumeric: 6500000,
    bedrooms: "2BHK",
    propertyType: "flat",
    size: "1100 sq ft",
    amenities: ["Gym", "Parking", "Security", "Club House"],
    images: ["https://example.com/property4.jpg"],
    description: "Modern 2BHK flat in Dwarka",
    builder: "Modern Developers",
    possession: "Ready to Move",
    floor: "12th Floor",
    facing: "West",
    age: "3 years",
  },
  {
    id: "RE005",
    name: "Garden View",
    location: "Bangalore",
    area: "Whitefield",
    price: "75L",
    priceNumeric: 7500000,
    bedrooms: "3BHK",
    propertyType: "flat",
    size: "1400 sq ft",
    amenities: ["Garden View", "Gym", "Parking", "Security"],
    images: ["https://example.com/property5.jpg"],
    description: "3BHK flat with beautiful garden view",
    builder: "Garden Developers",
    possession: "Ready to Move",
    floor: "6th Floor",
    facing: "North",
    age: "1 year",
  },
];

/**
 * Search properties based on criteria
 */
async function execute(parameters, context = {}) {
  try {
    const { location, budget, property_type, bedrooms, amenities } = parameters;

    logger.info("Searching properties", { parameters });

    // Filter properties based on criteria
    let filteredProperties = mockProperties;

    // Filter by location
    if (location) {
      const locationLower = location.toLowerCase();
      filteredProperties = filteredProperties.filter(
        (prop) =>
          prop.location.toLowerCase().includes(locationLower) ||
          prop.area.toLowerCase().includes(locationLower)
      );
    }

    // Filter by budget
    if (budget) {
      const budgetNum = parseBudget(budget);
      if (budgetNum) {
        filteredProperties = filteredProperties.filter(
          (prop) => prop.priceNumeric <= budgetNum
        );
      }
    }

    // Filter by property type
    if (property_type) {
      const typeLower = property_type.toLowerCase();
      filteredProperties = filteredProperties.filter((prop) =>
        prop.propertyType.toLowerCase().includes(typeLower)
      );
    }

    // Filter by bedrooms
    if (bedrooms) {
      const bedroomsLower = bedrooms.toLowerCase();
      filteredProperties = filteredProperties.filter((prop) =>
        prop.bedrooms.toLowerCase().includes(bedroomsLower)
      );
    }

    // Filter by amenities
    if (amenities && Array.isArray(amenities)) {
      filteredProperties = filteredProperties.filter((prop) =>
        amenities.some((amenity) =>
          prop.amenities.some((propAmenity) =>
            propAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        )
      );
    }

    // Limit results
    const maxResults = 5;
    const results = filteredProperties.slice(0, maxResults);

    if (results.length === 0) {
      return {
        success: true,
        result:
          "No properties found matching your criteria. Please try adjusting your search parameters.",
        response:
          "I couldn't find any properties matching your criteria. Would you like to try a different location, budget, or property type?",
      };
    }

    // Format response
    const response = formatPropertyResults(results, parameters);

    return {
      success: true,
      result: {
        properties: results,
        totalFound: results.length,
        searchCriteria: parameters,
      },
      response: response,
    };
  } catch (error) {
    logger.error("Property search failed", {
      error: error.message,
      parameters,
    });
    return {
      success: false,
      error: error.message,
      response:
        "I encountered an error while searching for properties. Please try again.",
    };
  }
}

/**
 * Parse budget string to numeric value
 */
function parseBudget(budget) {
  const budgetStr = budget.toString().toLowerCase();

  // Remove currency symbols and spaces
  const cleanBudget = budgetStr.replace(/[₹,\s]/g, "");

  // Handle different formats
  if (cleanBudget.includes("cr") || cleanBudget.includes("crore")) {
    const num = parseFloat(cleanBudget.replace(/[cr\s]/g, ""));
    return num * 10000000; // Convert crores to rupees
  } else if (cleanBudget.includes("l") || cleanBudget.includes("lakh")) {
    const num = parseFloat(cleanBudget.replace(/[l\s]/g, ""));
    return num * 100000; // Convert lakhs to rupees
  } else {
    // Assume it's already in rupees
    return parseFloat(cleanBudget);
  }
}

/**
 * Format property search results
 */
function formatPropertyResults(properties, searchCriteria) {
  let response = `🏠 Found ${properties.length} properties matching your criteria:\n\n`;

  properties.forEach((property, index) => {
    response += `${index + 1}. **${property.name}**\n`;
    response += `📍 ${property.area}, ${property.location}\n`;
    response += `💰 ₹${property.price} | ${property.bedrooms} | ${property.size}\n`;
    response += `🏢 ${
      property.propertyType.charAt(0).toUpperCase() +
      property.propertyType.slice(1)
    } | ${property.possession}\n`;
    response += `🏊 Amenities: ${property.amenities.slice(0, 3).join(", ")}${
      property.amenities.length > 3 ? "..." : ""
    }\n`;
    response += `📝 ${property.description}\n\n`;
  });

  response += `💡 To get more details about any property, say "Show me details of [property name]" or "Tell me about property [ID]"\n`;
  response += `📅 To schedule a visit, say "Schedule a visit for [property name]"\n`;
  response += `🔄 To search with different criteria, just tell me your new requirements!`;

  return response;
}

module.exports = {
  execute,
};
