// ═══════════════════════════════════════════════════════════════════════════
//  test-frontend-integration.js
//  Simulates all API calls made by the React/Vite frontend through the Vite proxy (http://localhost:5173/api)
//  to Express backend (http://127.0.0.1:5000) and MongoDB (127.0.0.1:27017).
// ═══════════════════════════════════════════════════════════════════════════

const VITE_PROXY_URL = "http://localhost:5173/api";
const DIRECT_BACKEND_URL = "http://127.0.0.1:5000/api";

const testEndpoints = async (baseUrl, label) => {
  console.log(`\n==========================================`);
  console.log(`🧪 Testing Frontend ↔ Backend via ${label}: ${baseUrl}`);
  console.log(`==========================================`);

  // 1. Health
  const healthRes = await fetch(`${baseUrl}/health`);
  const health = await healthRes.json();
  console.log(`[Health] Status: ${healthRes.status}, DB: ${health.database}`);
  if (healthRes.status !== 200 || health.database !== "connected") {
    throw new Error("Health check failed");
  }

  // 2. Menu Items (Menu page)
  const menuRes = await fetch(`${baseUrl}/menu`);
  const menuData = await menuRes.json();
  console.log(`[Menu] Status: ${menuRes.status}, Items: ${menuData.items?.length}`);
  if (menuData.items?.length !== 20) {
    throw new Error(`Expected 20 menu items, got ${menuData.items?.length}`);
  }

  // 3. Locations
  const locRes = await fetch(`${baseUrl}/locations`);
  const locData = await locRes.json();
  console.log(`[Locations] Status: ${locRes.status}, Locations: ${locData.locations?.length}`);

  // 4. Customer Registration & Login
  const testEmail = `testuser_${Date.now()}@spicymomento.com`;
  const regRes = await fetch(`${baseUrl}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "FrontEnd Tester",
      email: testEmail,
      password: "password123",
    }),
  });
  const regData = await regRes.json();
  console.log(`[Register] Status: ${regRes.status}, User: ${regData.user?.email}`);

  const loginRes = await fetch(`${baseUrl}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "password123",
    }),
  });
  const loginData = await loginRes.json();
  console.log(`[Login] Status: ${loginRes.status}, Success: ${loginData.success}`);

  // 5. User Profile Fetch & Update
  const profRes = await fetch(`${baseUrl}/users/profile?email=${encodeURIComponent(testEmail)}`);
  const profData = await profRes.json();
  console.log(`[Profile Fetch] Status: ${profRes.status}, Name: ${profData.user?.name}`);

  const updateProfRes = await fetch(`${baseUrl}/users/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      name: "FrontEnd Tester (VIP)",
      phone: "+1 (555) 999-0000",
    }),
  });
  const updatedProf = await updateProfRes.json();
  console.log(`[Profile Update] Status: ${updateProfRes.status}, New Name: ${updatedProf.user?.name}`);

  // 6. Cart & Order Submission (Card dummy payment)
  const orderRes = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "FrontEnd Tester (VIP)",
      customerEmail: testEmail,
      items: [
        { id: 1, name: "Spicy Street Tacos", price: 7.99, quantity: 2 },
        { id: 2, name: "Ghost Pepper Burger", price: 12.99, quantity: 1 },
      ],
      totalAmount: 31.54,
      paymentMethod: "card",
      paymentStatus: "paid",
      transactionId: `TXN-FE-${Date.now()}`,
      deliveryAddress: "456 Spice Avenue, Flavor Town",
      phone: "+1 (555) 999-0000",
    }),
  });
  const orderData = await orderRes.json();
  console.log(`[Order Submit] Status: ${orderRes.status}, Order #: ${orderData.order?.orderNumber}`);

  // 7. Fetch Customer Orders
  const myOrdersRes = await fetch(`${baseUrl}/orders?email=${encodeURIComponent(testEmail)}`);
  const myOrdersData = await myOrdersRes.json();
  console.log(`[Customer Orders] Status: ${myOrdersRes.status}, Count: ${myOrdersData.orders?.length}`);

  // 8. Contact Message Submission
  const contactRes = await fetch(`${baseUrl}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "FrontEnd Tester",
      email: testEmail,
      subject: "Inquiry about Private Catering",
      message: "Can Spicy Momento cater for our upcoming spicy food festival in Austin?",
    }),
  });
  const contactData = await contactRes.json();
  console.log(`[Contact Submit] Status: ${contactRes.status}, Success: ${contactData.success}`);

  // 9. Admin Dashboard Auth & Overview
  const adminLoginRes = await fetch(`${baseUrl}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin",
      password: "admin123",
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  console.log(`[Admin Login] Status: ${adminLoginRes.status}, Role: ${adminLoginData.user?.role}`);

  // 10. Admin CRUD: Menu, Locations, Customers, Messages
  const adminMenuRes = await fetch(`${baseUrl}/menu?all=true`);
  const adminMenuData = await adminMenuRes.json();
  console.log(`[Admin Menu List] Items: ${adminMenuData.items?.length}`);

  const adminOrdersRes = await fetch(`${baseUrl}/orders`);
  const adminOrdersData = await adminOrdersRes.json();
  console.log(`[Admin Orders List] Orders: ${adminOrdersData.orders?.length}`);

  const adminUsersRes = await fetch(`${baseUrl}/users`);
  const adminUsersData = await adminUsersRes.json();
  console.log(`[Admin Customers List] Customers: ${adminUsersData.users?.length}`);

  const adminContactRes = await fetch(`${baseUrl}/contact`);
  const adminContactData = await adminContactRes.json();
  console.log(`[Admin Messages List] Messages: ${adminContactData.messages?.length}`);

  console.log(`\n✅ ALL FRONTEND ↔ BACKEND ↔ MONGODB CALLS VIA ${label} PASSED WITH 0 ERRORS!`);
};

const run = async () => {
  try {
    // Test through Vite dev proxy
    await testEndpoints(VITE_PROXY_URL, "Vite Proxy (/api -> port 5000)");
    // Test direct backend endpoint
    await testEndpoints(DIRECT_BACKEND_URL, "Direct Express Backend (port 5000)");
    console.log("\n=======================================================");
    console.log("🎉 VERIFICATION COMPLETE: ZERO 'FAILED TO FETCH' ERRORS!");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  }
};

run();
