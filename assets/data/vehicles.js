/* PARAGOS sample rental vehicles (pricePerDay in PHP). First entry = "no rental" option. */
window.PARAGOS_VEHICLES = [
  { id: "no-rental", name: "No rental needed", type: "none", pricePerDay: 0, description: "Skip this step." },
  { id: "scooter", name: "Automatic Scooter", type: "scooter", seats: 2, pricePerDay: 600, description: "Easy island cruising. Helmet included. Valid driver's license required.", image: "https://picsum.photos/seed/paragos-scooter/400/240" },
  { id: "compact", name: "Compact Car (Toyota Wigo)", type: "car", seats: 4, pricePerDay: 1800, description: "Fuel-efficient city and highway car with air-conditioning.", image: "https://picsum.photos/seed/paragos-compact/400/240" },
  { id: "suv", name: "SUV (Toyota Fortuner)", type: "suv", seats: 7, pricePerDay: 4200, description: "Comfortable for families and rougher mountain roads.", image: "https://picsum.photos/seed/paragos-suv/400/240" },
  { id: "van", name: "Van with Driver (Toyota Hiace)", type: "van", seats: 12, pricePerDay: 5500, description: "Group transport with a local driver. Fuel not included.", image: "https://picsum.photos/seed/paragos-van/400/240" }
];
