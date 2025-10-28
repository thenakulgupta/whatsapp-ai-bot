const express = require("express");
const router = express.Router();

const properties = [
  {
    propertyId: "PROP-001",
    title: "Modern Apartment in Downtown",
    type: "Apartment",
    location: "New York, NY",
    price: 2500,
    bedrooms: 2,
    bathrooms: 2,
    area: "950 sq ft",
    status: "Available",
    description:
      "Spacious modern apartment with skyline views and close to amenities.",
    shortDescription: "2BHK modern downtown apartment.",
    listedDate: "2025-09-01",
    agentName: "Laura Brown",
    agentEmail: "laura.brown@realestate.com",
    availableFrom: "2025-11-01",
    furnishing: "Furnished",
    amenities: ["Gym", "Parking", "Security"],
    rating: 4.8,
    isFeatured: true,
  },
  {
    propertyId: "PROP-002",
    title: "Cozy Suburban Home",
    type: "House",
    location: "Austin, TX",
    price: 320000,
    bedrooms: 3,
    bathrooms: 2,
    area: "1800 sq ft",
    status: "Available",
    description:
      "A family-friendly house in a quiet suburb with a private garden.",
    shortDescription: "3BHK suburban house with garden.",
    listedDate: "2025-09-05",
    agentName: "James Miller",
    agentEmail: "james.miller@realestate.com",
    availableFrom: "2025-10-15",
    furnishing: "Semi-Furnished",
    amenities: ["Garden", "Garage", "Security"],
    rating: 4.5,
    isFeatured: false,
  },
  {
    propertyId: "PROP-003",
    title: "Luxury Beachfront Villa",
    type: "Villa",
    location: "Miami, FL",
    price: 1250000,
    bedrooms: 5,
    bathrooms: 4,
    area: "4000 sq ft",
    status: "Available",
    description:
      "Luxury villa with ocean views, private pool, and direct beach access.",
    shortDescription: "Beachfront 5BHK villa with pool.",
    listedDate: "2025-09-07",
    agentName: "Olivia White",
    agentEmail: "olivia.white@realestate.com",
    availableFrom: "2025-12-01",
    furnishing: "Fully Furnished",
    amenities: ["Pool", "Garage", "Wi-Fi", "Ocean View"],
    rating: 5.0,
    isFeatured: true,
  },
  {
    propertyId: "PROP-004",
    title: "Urban Studio Apartment",
    type: "Studio",
    location: "San Francisco, CA",
    price: 1800,
    bedrooms: 1,
    bathrooms: 1,
    area: "500 sq ft",
    status: "Rented",
    description: "Compact yet stylish studio ideal for young professionals.",
    shortDescription: "Modern downtown studio.",
    listedDate: "2025-09-10",
    agentName: "Daniel Kim",
    agentEmail: "daniel.kim@realestate.com",
    availableFrom: "2025-12-10",
    furnishing: "Furnished",
    amenities: ["Elevator", "Security", "Gym"],
    rating: 4.3,
    isFeatured: false,
  },
  {
    propertyId: "PROP-005",
    title: "Country Cottage Retreat",
    type: "Cottage",
    location: "Nashville, TN",
    price: 240000,
    bedrooms: 3,
    bathrooms: 2,
    area: "1600 sq ft",
    status: "Available",
    description:
      "Peaceful countryside cottage with wooden interiors and a large backyard.",
    shortDescription: "3BHK countryside cottage.",
    listedDate: "2025-09-12",
    agentName: "Emily Clark",
    agentEmail: "emily.clark@realestate.com",
    availableFrom: "2025-11-20",
    furnishing: "Semi-Furnished",
    amenities: ["Garden", "Fireplace"],
    rating: 4.7,
    isFeatured: false,
  },
  {
    propertyId: "PROP-006",
    title: "Penthouse Suite",
    type: "Penthouse",
    location: "Los Angeles, CA",
    price: 950000,
    bedrooms: 4,
    bathrooms: 3,
    area: "3000 sq ft",
    status: "Available",
    description:
      "Top-floor penthouse with panoramic city views and rooftop access.",
    shortDescription: "Luxury 4BHK penthouse with rooftop.",
    listedDate: "2025-09-14",
    agentName: "Ryan Davis",
    agentEmail: "ryan.davis@realestate.com",
    availableFrom: "2025-11-01",
    furnishing: "Fully Furnished",
    amenities: ["Rooftop", "Gym", "Pool"],
    rating: 4.9,
    isFeatured: true,
  },
  {
    propertyId: "PROP-007",
    title: "Downtown Office Space",
    type: "Commercial",
    location: "Chicago, IL",
    price: 850000,
    bedrooms: 0,
    bathrooms: 2,
    area: "5000 sq ft",
    status: "Available",
    description: "Spacious office space suitable for startups or agencies.",
    shortDescription: "Downtown office floor for lease.",
    listedDate: "2025-09-15",
    agentName: "Sophia Turner",
    agentEmail: "sophia.turner@realestate.com",
    availableFrom: "2025-11-05",
    furnishing: "Unfurnished",
    amenities: ["Elevator", "Security", "Parking"],
    rating: 4.6,
    isFeatured: false,
  },
  {
    propertyId: "PROP-008",
    title: "Coastal Family Home",
    type: "House",
    location: "San Diego, CA",
    price: 450000,
    bedrooms: 4,
    bathrooms: 3,
    area: "2400 sq ft",
    status: "Available",
    description: "Beautiful family home located minutes from the beach.",
    shortDescription: "4BHK coastal home with backyard.",
    listedDate: "2025-09-18",
    agentName: "Ava Thompson",
    agentEmail: "ava.thompson@realestate.com",
    availableFrom: "2025-11-10",
    furnishing: "Furnished",
    amenities: ["Garage", "Backyard", "Wi-Fi"],
    rating: 4.7,
    isFeatured: true,
  },
  {
    propertyId: "PROP-009",
    title: "Student Apartment",
    type: "Apartment",
    location: "Boston, MA",
    price: 1200,
    bedrooms: 1,
    bathrooms: 1,
    area: "600 sq ft",
    status: "Rented",
    description: "Affordable student housing near the university area.",
    shortDescription: "1BHK student-friendly apartment.",
    listedDate: "2025-09-20",
    agentName: "Ethan Hill",
    agentEmail: "ethan.hill@realestate.com",
    availableFrom: "2025-12-01",
    furnishing: "Semi-Furnished",
    amenities: ["Wi-Fi", "Security"],
    rating: 4.2,
    isFeatured: false,
  },
  {
    propertyId: "PROP-010",
    title: "Mountain View Cabin",
    type: "Cabin",
    location: "Aspen, CO",
    price: 350000,
    bedrooms: 3,
    bathrooms: 2,
    area: "2000 sq ft",
    status: "Available",
    description: "Cozy cabin with stunning mountain views and fireplace.",
    shortDescription: "3BHK mountain cabin retreat.",
    listedDate: "2025-09-22",
    agentName: "Noah Scott",
    agentEmail: "noah.scott@realestate.com",
    availableFrom: "2025-11-15",
    furnishing: "Fully Furnished",
    amenities: ["Fireplace", "Garage", "Wi-Fi"],
    rating: 4.8,
    isFeatured: true,
  },
];

const scheduledVisits = [
  {
    visitId: "VISIT-001",
    propertyId: "PROP-001",
    customerName: "John Doe",
    email: "john.doe@example.com",
    scheduledDate: "2025-11-02T14:00:00",
    status: "Confirmed",
    agentName: "Laura Brown",
    notes: "Customer wants to check parking space and balcony view.",
  },
  {
    visitId: "VISIT-002",
    propertyId: "PROP-003",
    customerName: "Sophia Martinez",
    email: "sophia.martinez@example.com",
    scheduledDate: "2025-11-05T11:30:00",
    status: "Pending",
    agentName: "Olivia White",
    notes: "Interested in long-term lease options.",
  },
  {
    visitId: "VISIT-003",
    propertyId: "PROP-006",
    customerName: "Michael Johnson",
    email: "michael.j@example.com",
    scheduledDate: "2025-11-07T16:00:00",
    status: "Confirmed",
    agentName: "Ryan Davis",
    notes: "VIP client; prefers private tour.",
  },
  {
    visitId: "VISIT-004",
    propertyId: "PROP-008",
    customerName: "Ava Patel",
    email: "ava.patel@example.com",
    scheduledDate: "2025-11-08T10:00:00",
    status: "Rescheduled",
    agentName: "Ava Thompson",
    notes: "Requested weekend visit.",
  },
  {
    visitId: "VISIT-005",
    propertyId: "PROP-010",
    customerName: "Ethan Clark",
    email: "ethan.clark@example.com",
    scheduledDate: "2025-11-10T13:00:00",
    status: "Cancelled",
    agentName: "Noah Scott",
    notes: "Cancelled due to travel change.",
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

router.get("/search-properties", async (req, res) => {
  const { title, location, budget, property_type, bedrooms, amenities } =
    req.query;
  res.json({
    data: properties.filter(
      (property) =>
        property.location?.toLowerCase().includes(location?.toLowerCase()) ||
        property.title?.toLowerCase().includes(title?.toLowerCase())
    ),
  });
});

router.get("/get-property-details", async (req, res) => {
  const { property_id, property_name } = req.query;
  res.json({
    data: properties.find((property) => property.propertyId === property_id),
  });
});

router.get("/schedule-visit", async (req, res) => {
  const {
    property_id,
    visit_type,
    preferred_date,
    preferred_time,
    contact_number,
  } = req.query;
  res.json({
    data: "Visit scheduled successfully",
  });
});

router.get("/get-scheduled-visits", async (req, res) => {
  res.json({
    data: scheduledVisits,
  });
});

router.get("/cancel-visit", async (req, res) => {
  const { visit_id } = req.query;
  res.json({
    data: "Visit cancelled successfully",
  });
});

router.get("/get-loan-estimate", async (req, res) => {
  const { property_price, down_payment, loan_tenure, interest_rate } =
    req.query;
  res.json({
    data: {
      loan_amount: 1000000,
      monthly_emi: 10000,
      total_interest: 100000,
      total_amount: 1100000,
    },
  });
});

router.get("/get-area-info", async (req, res) => {
  const { area_name, city, info_type } = req.query;
  res.json({
    data: {
      area_name: "Whitefield",
      city: "Bangalore",
      info_type: "amenities",
      info: "The area is known for its good connectivity and proximity to the airport.",
    },
  });
});

router.get("/compare-properties", async (req, res) => {
  const { property_ids, comparison_criteria } = req.query;
  res.json({
    data: {
      property_ids: ["PROP-001", "PROP-002", "PROP-003"],
      comparison_criteria: ["price", "size", "amenities"],
      comparison_results: [
        {
          property_id: "PROP-001",
          price: 1000000,
          size: "1000 sq ft",
          amenities: ["Gym", "Parking", "Security"],
        },
        {
          property_id: "PROP-002",
          price: 1500000,
          size: "1500 sq ft",
          amenities: ["Gym", "Parking", "Security"],
        },
      ],
    },
  });
});

module.exports = router;
