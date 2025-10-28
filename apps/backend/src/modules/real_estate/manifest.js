module.exports = {
  name: "Real Estate",
  description:
    "Find and explore properties, schedule visits, and get real estate assistance",
  icon: "🏠",
  welcomeMessage:
    'Welcome to our Real Estate demo! I can help you find properties, schedule visits, and answer questions about real estate. Try saying "Show me 2BHK flats under ₹50L in Gurgaon" or "Schedule a property visit".',
  exitMessage:
    'Thank you for exploring our Real Estate services! Type "exit" to return to the main menu.',

  functions: [
    {
      name: "search_properties",
      description:
        "Search for properties based on criteria like location, budget, type, and size",
      parameters: {
        location: { type: "string", description: "City or area name" },
        budget: {
          type: "string",
          description: 'Budget range (e.g., "50L", "1Cr-2Cr")',
        },
        property_type: {
          type: "string",
          description: "Type of property (flat, house, villa, etc.)",
        },
        bedrooms: {
          type: "string",
          description: "Number of bedrooms (1BHK, 2BHK, 3BHK, etc.)",
        },
        amenities: { type: "array", description: "Desired amenities" },
      },
      required: ["location"],
      examples: [
        "Show me 2BHK flats under ₹50L in Gurgaon",
        "Find 3BHK houses in Bangalore with swimming pool",
        "Search for 1BHK apartments in Mumbai under 1Cr",
      ],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/real-estate/search-properties",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          location: "string",
          budget: "string",
          property_type: "string",
          bedrooms: "string",
          amenities: "array",
        },
      },
    },
    {
      name: "get_property_details",
      description: "Get detailed information about a specific property",
      parameters: {
        property_id: { type: "string", description: "Property ID or name" },
        property_name: { type: "string", description: "Property name" },
      },
      required: ["property_id"],
      examples: [
        "Show me details of property ABC123",
        "Tell me about Green Valley Apartments",
      ],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/real-estate/get-property-details",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          property_id: "string",
          property_name: "string",
        },
      },
    },
    {
      name: "schedule_visit",
      description: "Schedule a property visit or virtual tour",
      parameters: {
        property_id: { type: "string", description: "Property ID" },
        visit_type: {
          type: "string",
          description: "Type of visit (physical, virtual)",
        },
        preferred_date: {
          type: "string",
          description: "Preferred date for visit",
        },
        preferred_time: { type: "string", description: "Preferred time slot" },
        contact_number: {
          type: "string",
          description: "Contact number for scheduling",
        },
      },
      required: ["property_id"],
      examples: [
        "Schedule a visit for property ABC123",
        "Book a virtual tour for tomorrow at 2 PM",
      ],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/real-estate/schedule-visit",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          property_id: "string",
          visit_type: "string",
          preferred_date: "string",
          preferred_time: "string",
          contact_number: "string",
        },
      },
    },
    {
      name: "get_scheduled_visits",
      description: "Get all scheduled property visits",
      examples: ["Get all scheduled visits", "Show me my scheduled visits"],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/real-estate/get-scheduled-visits",
        method: "GET",
      },
    },
    {
      name: "cancel_visit",
      description: "Cancel a scheduled property visit",
      parameters: {
        booking_id: { type: "string", description: "Booking or visit ID" },
        property_id: { type: "string", description: "Property ID" },
        reason: { type: "string", description: "Reason for cancellation" },
      },
      required: ["booking_id"],
      examples: [
        "Cancel my visit booking 12345",
        "Cancel visit for property ABC123",
      ],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/real-estate/cancel-visit",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          booking_id: "string",
          property_id: "string",
          reason: "string",
        },
      },
    },
    {
      name: "get_loan_estimate",
      description: "Get home loan estimate and EMI calculation",
      parameters: {
        property_price: { type: "number", description: "Property price" },
        down_payment: { type: "number", description: "Down payment amount" },
        loan_tenure: { type: "number", description: "Loan tenure in years" },
        interest_rate: {
          type: "number",
          description: "Interest rate (optional)",
        },
      },
      required: ["property_price"],
      examples: [
        "Calculate EMI for ₹50L property with 20% down payment",
        "Get loan estimate for 1Cr property for 20 years",
      ],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/real-estate/get-loan-estimate",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          property_price: "number",
          down_payment: "number",
          loan_tenure: "number",
          interest_rate: "number",
        },
      },
    },
    {
      name: "get_area_info",
      description: "Get information about a specific area or locality",
      parameters: {
        area_name: { type: "string", description: "Area or locality name" },
        city: { type: "string", description: "City name" },
        info_type: {
          type: "string",
          description:
            "Type of info needed (amenities, connectivity, prices, etc.)",
        },
      },
      required: ["area_name"],
      examples: [
        "Tell me about Whitefield area in Bangalore",
        "What are the amenities in Gurgaon Sector 29?",
      ],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/real-estate/get-area-info",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          area_name: "string",
          city: "string",
          info_type: "string",
        },
      },
    },
    {
      name: "compare_properties",
      description: "Compare multiple properties side by side",
      parameters: {
        property_ids: {
          type: "array",
          description: "Array of property IDs to compare",
        },
        comparison_criteria: {
          type: "array",
          description: "Criteria to compare (price, size, amenities, etc.)",
        },
      },
      required: ["property_ids"],
      examples: [
        "Compare properties ABC123 and XYZ789",
        "Compare these 3 properties on price and amenities",
      ],
      apiInfo: {
        url: "https://whatsapp-ai-bot.nakultelestock.com/demo-data/real-estate/compare-properties",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          property_ids: "array",
          comparison_criteria: "array",
        },
      },
    },
  ],

  config: {
    defaultLocation: "Gurgaon",
    currency: "INR",
    supportedCities: [
      "Gurgaon",
      "Delhi",
      "Mumbai",
      "Bangalore",
      "Pune",
      "Hyderabad",
      "Chennai",
    ],
    propertyTypes: [
      "flat",
      "house",
      "villa",
      "apartment",
      "penthouse",
      "studio",
    ],
    visitTypes: ["physical", "virtual"],
    timeSlots: ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM", "6:00 PM"],
    maxPropertiesPerSearch: 10,
    defaultLoanTenure: 20,
    defaultInterestRate: 8.5,
  },
};
