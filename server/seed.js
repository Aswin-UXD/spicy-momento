import mongoose from "mongoose";
import dotenv from "dotenv";
import MenuItem from "./models/MenuItem.js";
import Location from "./models/Location.js";
import User from "./models/User.js";
import Order from "./models/Order.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/spicy_momento";

const menuSeed = [
  {
    id: 1,
    name: "Spicy Street Tacos",
    category: "Tacos",
    price: 7.99,
    bestPrice: true,
    spiceLevel: 3,
    isSpicy: true,
    description: "Three crispy corn tortillas loaded with shredded chili chicken, diced onion, fresh cilantro, and salsa roja.",
    image: "/src/assets/images/spicy-tacos.jpg",
  },
  {
    id: 2,
    name: "Ghost Pepper Burger",
    category: "Burgers",
    price: 12.99,
    bestPrice: false,
    spiceLevel: 5,
    isSpicy: true,
    description: "Thick Angus patty infused with ghost pepper relish, molten pepper jack cheese, crispy onions, and habanero mayo.",
    image: "/src/assets/images/ghost-burger.jpg",
  },
  {
    id: 3,
    name: "Fire Buffalo Wings",
    category: "Wings",
    price: 10.99,
    bestPrice: false,
    spiceLevel: 4,
    isSpicy: true,
    description: "Eight jumbo crispy wings tossed in our signature 4-alarm cayenne butter glaze. Served with cool ranch dip.",
    image: "/src/assets/images/fire-wings.jpg",
  },
  {
    id: 4,
    name: "Mild Fiesta Rice Bowl",
    category: "Bowls",
    price: 8.49,
    bestPrice: true,
    spiceLevel: 1,
    isSpicy: false,
    description: "Seasoned cilantro-lime brown rice topped with pinto beans, sweet roasted corn, pico de gallo, and avocado drizzle.",
    image: "/src/assets/images/mild-bowl.jpg",
  },
  {
    id: 5,
    name: "Loaded Chili Cheese Fries",
    category: "Sides",
    price: 6.99,
    bestPrice: true,
    spiceLevel: 2,
    isSpicy: true,
    description: "Golden crinkle-cut fries drenched in slow-simmered beef chili, melted cheddar sauce, and pickled jalapeño rings.",
    image: "/src/assets/images/chili-fries.jpg",
  },
  {
    id: 6,
    name: "Inferno Crunch Wrap",
    category: "Burritos",
    price: 9.99,
    bestPrice: false,
    spiceLevel: 4,
    isSpicy: true,
    description: "Large griddled tortilla packed with spicy carne asada, tostada shell, queso blanco, sour cream, and hot serrano salsa.",
    image: "/src/assets/images/inferno-wrap.jpg",
  },
  {
    id: 7,
    name: "Cheddar Jalapeño Poppers",
    category: "Sides",
    price: 6.49,
    bestPrice: true,
    spiceLevel: 3,
    isSpicy: true,
    description: "Six hollowed jalapeños stuffed with aged cheddar and cream cheese, breaded and fried to golden perfection.",
    image: "/src/assets/images/jalapeno-poppers.jpg",
  },
  {
    id: 8,
    name: "Smoked Carnitas Burrito",
    category: "Burritos",
    price: 11.49,
    bestPrice: false,
    spiceLevel: 2,
    isSpicy: true,
    description: "12-hour braised pork carnitas wrapped with Mexican black beans, Monterey Jack, guacamole, and roasted salsa verde.",
    image: "/src/assets/images/carnitas-burrito.jpg",
  },
  {
    id: 9,
    name: "Volcano Nachos Supremos",
    category: "Sides",
    price: 9.49,
    bestPrice: false,
    spiceLevel: 3,
    isSpicy: true,
    description: "Fresh fried tortilla chips heaped with spiced beef, warm nacho cheese, black olives, jalapeños, and smoky chipotle crema.",
    image: "/src/assets/images/nachos-supremos.jpg",
  },
  {
    id: 10,
    name: "Chili Chicken Quesadilla",
    category: "Sides",
    price: 8.99,
    bestPrice: true,
    spiceLevel: 2,
    isSpicy: true,
    description: "Crisp buttery flour tortilla stuffed with spiced shredded chicken, roasted poblano peppers, and melted Oaxaca cheese.",
    image: "/src/assets/images/grilled-quesadilla.jpg",
  },
  {
    id: 11,
    name: "Volcano BBQ Pork Ribs",
    category: "Specials",
    price: 14.99,
    bestPrice: false,
    spiceLevel: 4,
    isSpicy: true,
    description: "Half-rack of tender baby back ribs slow-smoked and glazed in our blazing habanero-honey barbecue sauce.",
    image: "/src/assets/images/volcano-ribs.jpg",
  },
  {
    id: 12,
    name: "Spicy Mexican Street Corn",
    category: "Sides",
    price: 4.99,
    bestPrice: true,
    spiceLevel: 2,
    isSpicy: true,
    description: "Char-grilled whole corn on the cob slathered with chipotle mayo, cotija cheese, chili powder, and fresh lime.",
    image: "/src/assets/images/spicy-elote.jpg",
  },
  {
    id: 13,
    name: "Baja Crispy Fish Tacos",
    category: "Tacos",
    price: 9.99,
    bestPrice: false,
    spiceLevel: 2,
    isSpicy: true,
    description: "Beer-battered Alaskan cod fillets nestled in warm corn tortillas with shredded cabbage, mango salsa, and chipotle lime drizzle.",
    image: "/src/assets/images/crispy-fish-tacos.jpg",
  },
  {
    id: 14,
    name: "Double Devil Smash Burger",
    category: "Burgers",
    price: 13.99,
    bestPrice: false,
    spiceLevel: 4,
    isSpicy: true,
    description: "Two crispy-edged smashed beef patties, double smoked bacon, fiery ghost pepper pepperjack, grilled jalapeños, and devil aioli.",
    image: "/src/assets/images/smash-devil-burger.jpg",
  },
  {
    id: 15,
    name: "Firecracker Fried Shrimp",
    category: "Specials",
    price: 11.99,
    bestPrice: false,
    spiceLevel: 4,
    isSpicy: true,
    description: "Golden panko-crusted jumbo gulf shrimp tossed in sweet and spicy sriracha honey glaze, finished with toasted sesame seeds.",
    image: "/src/assets/images/firecracker-shrimp.jpg",
  },
  {
    id: 16,
    name: "Spicy Chorizo Queso Fundido",
    category: "Sides",
    price: 7.49,
    bestPrice: true,
    spiceLevel: 3,
    isSpicy: true,
    description: "Bubbling skillet of melted Chihuahua and Asadero cheeses crowned with crispy house-made Mexican chorizo and warm tortilla chips.",
    image: "/src/assets/images/chorizo-dip.jpg",
  },
  {
    id: 17,
    name: "Cinnamon Sugar Spicy Churros",
    category: "Desserts",
    price: 5.49,
    bestPrice: true,
    spiceLevel: 1,
    isSpicy: false,
    description: "Four warm, crispy Mexican pastry batons rolled in cinnamon sugar with an ancho chili kick. Served with spicy Mexican dark chocolate dip.",
    image: "/src/assets/images/spicy-churros.jpg",
  },
  {
    id: 18,
    name: "Cayenne Dark Chocolate Brownie",
    category: "Desserts",
    price: 4.49,
    bestPrice: true,
    spiceLevel: 2,
    isSpicy: true,
    description: "Rich, fudgy dark chocolate brownie infused with a subtle hint of cayenne pepper and drizzled with salted chili caramel.",
    image: "/src/assets/images/chili-brownie.jpg",
  },
  {
    id: 19,
    name: "Agua de Horchata Picante",
    category: "Drinks",
    price: 3.99,
    bestPrice: true,
    spiceLevel: 1,
    isSpicy: false,
    description: "Traditional sweet cinnamon rice milk crafted in-house, lightly sprinkled with chili nutmeg powder over crushed ice.",
    image: "/src/assets/images/horchata.jpg",
  },
  {
    id: 20,
    name: "Hibiscus Chili Lime Soda",
    category: "Drinks",
    price: 3.49,
    bestPrice: true,
    spiceLevel: 1,
    isSpicy: false,
    description: "Sparkling iced agua de Jamaica blended with fresh lime juice, organic agave, and a pinch of cayenne salt on the rim.",
    image: "/src/assets/images/chili-lime-soda.jpg",
  },
];

const locationsSeed = [
  {
    id: 1,
    name: "Downtown Food Park",
    address: "123 Chili Street, Downtown",
    hours: "Mon-Sun: 10AM - 10PM",
    phone: "+1 (555) 123-4567",
    lat: 40.7128,
    lng: -74.006,
  },
  {
    id: 2,
    name: "Midtown Square",
    address: "456 Pepper Ave, Midtown",
    hours: "Mon-Fri: 11AM - 9PM",
    phone: "+1 (555) 234-5678",
    lat: 40.7589,
    lng: -73.9851,
  },
  {
    id: 3,
    name: "Uptown Campus Hub",
    address: "789 Salsa Blvd, Uptown",
    hours: "Sat-Sun: 12PM - 8PM",
    phone: "+1 (555) 345-6789",
    lat: 40.8075,
    lng: -73.9626,
  },
];

export const seedDatabase = async () => {
  try {
    console.log("[Seed] Checking MongoDB collections...");

    // 1. Seed Menu Items
    const menuCount = await MenuItem.countDocuments();
    if (menuCount === 0) {
      console.log("[Seed] Inserting 20 menu items...");
      await MenuItem.insertMany(menuSeed);
      console.log("[Seed] Menu items seeded successfully.");
    } else {
      console.log(`[Seed] Menu already contains ${menuCount} items.`);
    }

    // 2. Seed Locations
    const locCount = await Location.countDocuments();
    if (locCount === 0) {
      console.log("[Seed] Inserting food truck locations...");
      await Location.insertMany(locationsSeed);
      console.log("[Seed] Locations seeded successfully.");
    } else {
      console.log(`[Seed] Locations already contains ${locCount} branches.`);
    }

    // 3. Seed Default Member Profile & Predefined Admin
    const adminExists = await User.findOne({ email: "admin@spicymomento.com" });
    if (!adminExists) {
      console.log("[Seed] Creating predefined Admin account (admin@spicymomento.com)...");
      await User.create({
        name: "Admin Boss",
        email: "admin@spicymomento.com",
        password: "admin123",
        phone: "+1 (555) 999-0000",
        address: "Food Truck Central HQ, Kitchen #1",
        memberTier: "👑 Head Chef & Admin",
        role: "admin",
        favorites: [1, 2, 3],
      });
      console.log("[Seed] Predefined Admin account created successfully!");
    } else if (adminExists.role !== "admin" || adminExists.password !== "admin123") {
      adminExists.role = "admin";
      adminExists.password = "admin123";
      await adminExists.save();
    }

    const alexExists = await User.findOne({ email: "alex@spicymomento.com" });
    let defaultUser = alexExists;
    if (!alexExists) {
      console.log("[Seed] Creating default customer member Alex M....");
      defaultUser = await User.create({
        name: "Alex M.",
        email: "alex@spicymomento.com",
        password: "password123",
        phone: "+1 (555) 789-0123",
        address: "123 Spice Street, Apt 4B, Foodie City",
        memberTier: "🌶 Spice Club VIP",
        role: "customer",
        favorites: [1, 2, 6, 14],
      });
      console.log("[Seed] Default customer user created.");
    }

    // 4. Seed initial sample order if orders empty
    const orderCount = await Order.countDocuments();
    if (orderCount === 0 && defaultUser) {
      await Order.create({
        orderNumber: "SM-9482",
        customerName: defaultUser.name,
        customerEmail: defaultUser.email,
        items: [
          { id: 1, name: "Spicy Street Tacos", price: 7.99, quantity: 2 },
          { id: 5, name: "Loaded Chili Cheese Fries", price: 6.99, quantity: 1 },
        ],
        subtotal: 22.97,
        tax: 2.04,
        totalAmount: 25.01,
        status: "delivered",
        paymentMethod: "card",
        paymentStatus: "paid",
        transactionId: "TXN-SEED9482",
        deliveryAddress: "123 Spice Street, Apt 4B, Foodie City",
        phone: "+1 (555) 789-0123",
        specialNotes: "Extra lime wedges please!",
      });

      console.log("[Seed] Sample order with payment details created.");
    }

    console.log("[Seed] Database ready! 🌶");
  } catch (err) {
    console.error("[Seed] Error during seeding:", err);
  }
};

// If run directly via node seed.js
if (process.argv[1]?.endsWith("seed.js")) {
  mongoose
    .connect(MONGODB_URI)
    .then(async () => {
      console.log("[Seed CLI] Connected to MongoDB at", MONGODB_URI);
      await seedDatabase();
      await mongoose.disconnect();
      console.log("[Seed CLI] Finished and disconnected.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Seed CLI] Connection failed:", err);
      process.exit(1);
    });
}
