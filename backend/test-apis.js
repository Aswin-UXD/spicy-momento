const BASE_URL = "http://localhost:5000/api";

const assert = (condition, msg) => {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
};

const runTests = async () => {
  console.log("\n==========================================");
  console.log("🌶 SPICY MOMENTO API TEST SUITE");
  console.log("==========================================\n");

  // 1. Health Check
  console.log("── Testing Health Check ──");
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200, "Health check returns 200");
  assert(healthData.database === "connected", "Database is connected");

  // 2. Menu Items
  console.log("\n── Testing Menu APIs ──");
  const menuRes = await fetch(`${BASE_URL}/menu`);
  const menuData = await menuRes.json();
  assert(menuRes.status === 200, "GET /api/menu returns 200");
  assert(menuData.items.length === 20, `Menu contains exactly 20 items (got ${menuData.items.length})`);

  const categoryRes = await fetch(`${BASE_URL}/menu/categories`);
  const categoryData = await categoryRes.json();
  assert(categoryRes.status === 200, "GET /api/menu/categories returns 200");
  assert(categoryData.categories.includes("Tacos"), "Categories include Tacos");

  const filterRes = await fetch(`${BASE_URL}/menu?category=Tacos`);
  const filterData = await filterRes.json();
  assert(filterRes.status === 200, "GET /api/menu?category=Tacos returns 200");
  assert(filterData.items.length > 0, "Tacos filter returns items");

  const singleItemRes = await fetch(`${BASE_URL}/menu/1`);
  const singleItemData = await singleItemRes.json();
  assert(singleItemRes.status === 200, "GET /api/menu/1 returns 200");
  assert(singleItemData.item.name === "Spicy Street Tacos", "Item 1 is Spicy Street Tacos");

  // 3. Locations
  console.log("\n── Testing Locations API ──");
  const locRes = await fetch(`${BASE_URL}/locations`);
  const locData = await locRes.json();
  assert(locRes.status === 200, "GET /api/locations returns 200");
  assert(locData.locations.length >= 3, `Locations returns 3+ branches (got ${locData.locations.length})`);

  // 4. Users / Auth / Profile
  console.log("\n── Testing Users & Auth APIs ──");

  // Admin login check
  const adminLoginRes = await fetch(`${BASE_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@spicymomento.com",
      password: "admin123",
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  assert(adminLoginRes.status === 200, "Admin login with email returns 200");
  assert(adminLoginData.user.role === "admin", "Admin user has role: 'admin'");

  // Admin login with alias "admin"
  const adminAliasRes = await fetch(`${BASE_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin",
      password: "admin123",
    }),
  });
  assert(adminAliasRes.status === 200, "Admin login with 'admin' User ID returns 200");

  // Invalid login check (strict auth, no auto create)
  const invalidLoginRes = await fetch(`${BASE_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "nonexistent_user_xyz@example.com",
      password: "wrongpassword",
    }),
  });
  assert(invalidLoginRes.status === 401, "Unregistered user login is rejected with 401");

  const testEmail = `tester_${Date.now()}@example.com`;
  const registerRes = await fetch(`${BASE_URL}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Sammy Pepper",
      email: testEmail,
      password: "secretpassword123",
      phone: "+1 (555) 999-8888",
      address: "42 Habanero Highway",
    }),
  });
  const registerData = await registerRes.json();
  assert(registerRes.status === 201, "POST /api/users/register returns 201 Created");
  assert(registerData.user.name === "Sammy Pepper", "Registered user has correct name");
  assert(registerData.user.role === "customer", "Registered user has role: 'customer'");

  const loginRes = await fetch(`${BASE_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "secretpassword123",
    }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, "POST /api/users/login returns 200");
  assert(loginData.user.email === testEmail, "Login returns matching user email");
  assert(loginData.user.role === "customer", "Customer user has role 'customer'");

  const profileRes = await fetch(`${BASE_URL}/users/profile?email=${testEmail}`);
  const profileData = await profileRes.json();
  assert(profileRes.status === 200, "GET /api/users/profile returns 200");
  assert(profileData.user.name === "Sammy Pepper", "Profile returns correct name");
  assert(profileData.user.role === "customer", "Profile returns customer role");

  const updateProfileRes = await fetch(`${BASE_URL}/users/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      name: "Sammy Hot Pepper",
      phone: "+1 (555) 777-6666",
    }),
  });
  const updateProfileData = await updateProfileRes.json();
  assert(updateProfileRes.status === 200, "PUT /api/users/profile returns 200");
  assert(updateProfileData.user.name === "Sammy Hot Pepper", "Profile updated name successfully");

  // 5. Cart / Orders & Payment
  console.log("\n── Testing Orders & Payment APIs ──");

  // Require login before ordering check
  const guestOrderRes = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerEmail: "",
      items: [{ id: 1, name: "Spicy Street Tacos", price: 7.99, quantity: 1 }],
    }),
  });
  assert(guestOrderRes.status === 400, "Order without customer email is rejected (Login required)");

  // Order with Card payment (Simulated Paid)
  const cardOrderRes = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Sammy Hot Pepper",
      customerEmail: testEmail,
      items: [
        { id: 1, name: "Spicy Street Tacos", price: 7.99, quantity: 2 },
        { id: 2, name: "Ghost Pepper Burger", price: 12.99, quantity: 1 },
      ],
      paymentMethod: "card",
      paymentStatus: "paid",
      transactionId: "TXN-CARD-9944",
      deliveryAddress: "42 Habanero Highway, Food City",
      phone: "+1 (555) 777-6666",
      specialNotes: "Make tacos extra crispy please!",
    }),
  });
  const cardOrderData = await cardOrderRes.json();
  assert(cardOrderRes.status === 201, "POST /api/orders with Card payment returns 201");
  assert(cardOrderData.order.paymentMethod === "card", "Order saved paymentMethod: 'card'");
  assert(cardOrderData.order.paymentStatus === "paid", "Order saved paymentStatus: 'paid'");
  assert(cardOrderData.order.transactionId === "TXN-CARD-9944", "Order saved transactionId");
  const orderNum = cardOrderData.order.orderNumber;

  // Order with UPI payment
  const upiOrderRes = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Sammy Hot Pepper",
      customerEmail: testEmail,
      items: [{ id: 5, name: "Loaded Chili Cheese Fries", price: 6.99, quantity: 1 }],
      paymentMethod: "upi",
      paymentStatus: "paid",
      transactionId: "UPI-88492049",
      deliveryAddress: "42 Habanero Highway",
      phone: "+1 (555) 777-6666",
    }),
  });
  const upiOrderData = await upiOrderRes.json();
  assert(upiOrderRes.status === 201, "POST /api/orders with UPI payment returns 201");
  assert(upiOrderData.order.paymentMethod === "upi", "Order saved paymentMethod: 'upi'");
  assert(upiOrderData.order.paymentStatus === "paid", "Order saved paymentStatus: 'paid'");

  // Order with Cash on Delivery (COD, Pending payment)
  const codOrderRes = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Sammy Hot Pepper",
      customerEmail: testEmail,
      items: [{ id: 6, name: "Inferno Crunch Wrap", price: 9.99, quantity: 1 }],
      paymentMethod: "cod",
      deliveryAddress: "42 Habanero Highway",
      phone: "+1 (555) 777-6666",
    }),
  });
  const codOrderData = await codOrderRes.json();
  assert(codOrderRes.status === 201, "POST /api/orders with COD returns 201");
  assert(codOrderData.order.paymentMethod === "cod", "Order saved paymentMethod: 'cod'");
  assert(codOrderData.order.paymentStatus === "pending", "COD order saved paymentStatus: 'pending'");

  const getOrdersRes = await fetch(`${BASE_URL}/orders?email=${testEmail}`);
  const getOrdersData = await getOrdersRes.json();
  assert(getOrdersRes.status === 200, "GET /api/orders returns 200");
  assert(getOrdersData.orders.length >= 3, "Customer has at least 3 orders saved in MongoDB");

  const getSingleOrderRes = await fetch(`${BASE_URL}/orders/${orderNum}`);
  const getSingleOrderData = await getSingleOrderRes.json();
  assert(getSingleOrderRes.status === 200, "GET /api/orders/:id returns 200");
  assert(getSingleOrderData.order.orderNumber === orderNum, "Retrieved order matches order number");

  const patchOrderRes = await fetch(`${BASE_URL}/orders/${orderNum}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "preparing" }),
  });
  const patchOrderData = await patchOrderRes.json();
  assert(patchOrderRes.status === 200, "PATCH /api/orders/:id returns 200");
  assert(patchOrderData.order.status === "preparing", "Order status updated to preparing");

  const cancelOrderRes = await fetch(`${BASE_URL}/orders/${orderNum}`, {
    method: "DELETE",
  });
  const cancelOrderData = await cancelOrderRes.json();
  assert(cancelOrderRes.status === 200, "DELETE /api/orders/:id returns 200");
  assert(cancelOrderData.order.status === "cancelled", "Order status marked as cancelled");

  // 6. Contact & Catering
  console.log("\n── Testing Contact & Catering APIs ──");
  const contactRes = await fetch(`${BASE_URL}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Maria Gonzalez",
      email: "maria@example.com",
      subject: "Food Truck Schedule Inquiry",
      message: "Will you be at Downtown Food Park this Friday evening?",
    }),
  });
  const contactData = await contactRes.json();
  assert(contactRes.status === 201, "POST /api/contact returns 201 Created");
  assert(contactData.success === true, "Contact inquiry submission successful");

  const cateringRes = await fetch(`${BASE_URL}/catering`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Carlos Rivera",
      email: "carlos.corp@example.com",
      guestCount: 50,
      eventDate: "2026-10-15",
      message: "Corporate anniversary party taco truck booking",
    }),
  });
  const cateringData = await cateringRes.json();
  assert(cateringRes.status === 201, "POST /api/catering returns 201 Created");
  assert(cateringData.success === true, "Catering request submission successful");

  const listContactRes = await fetch(`${BASE_URL}/contact`);
  const listContactData = await listContactRes.json();
  assert(listContactRes.status === 200, "GET /api/contact returns 200");
  assert(listContactData.messages.length >= 2, "Inquiries list includes submitted messages");

  // 7. Menu CRUD Operations
  console.log("\n── Testing Menu CRUD APIs ──");
  const createMenuRes = await fetch(`${BASE_URL}/menu`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Fiery Mango Habanero Wings",
      category: "Wings",
      price: 13.99,
      description: "Crispy wings tossed in sweet mango and blistering habanero sauce.",
      spiceLevel: 4,
      isSpicy: true,
      bestPrice: false,
      available: true,
    }),
  });
  const createMenuData = await createMenuRes.json();
  assert(createMenuRes.status === 201, "POST /api/menu creates new item");
  const newMenuId = createMenuData.item.id;

  const updateMenuRes = await fetch(`${BASE_URL}/menu/${newMenuId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      price: 14.49,
      bestPrice: true,
    }),
  });
  const updateMenuData = await updateMenuRes.json();
  assert(updateMenuRes.status === 200, "PUT /api/menu/:id updates item");
  assert(updateMenuData.item.price === 14.49, "Menu item price updated to 14.49");

  const deleteMenuRes = await fetch(`${BASE_URL}/menu/${newMenuId}`, {
    method: "DELETE",
  });
  assert(deleteMenuRes.status === 200, "DELETE /api/menu/:id deletes item");

  // 8. Locations CRUD Operations
  console.log("\n── Testing Locations CRUD APIs ──");
  const createLocRes = await fetch(`${BASE_URL}/locations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Midtown Office Plaza",
      address: "550 5th Avenue, New York, NY",
      hours: "Mon-Wed: 11:00 AM - 3:00 PM",
      phone: "+1 (555) 774-2904",
      isActive: true,
    }),
  });
  const createLocData = await createLocRes.json();
  assert(createLocRes.status === 201, "POST /api/locations creates new food truck stop");
  const newLocId = createLocData.location.id;

  const updateLocRes = await fetch(`${BASE_URL}/locations/${newLocId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hours: "Mon-Wed: 11:00 AM - 4:00 PM",
      isActive: false,
    }),
  });
  const updateLocData = await updateLocRes.json();
  assert(updateLocRes.status === 200, "PUT /api/locations/:id updates location");
  assert(updateLocData.location.isActive === false, "Location isActive toggled to false");

  const deleteLocRes = await fetch(`${BASE_URL}/locations/${newLocId}`, {
    method: "DELETE",
  });
  assert(deleteLocRes.status === 200, "DELETE /api/locations/:id deletes location");

  // 9. Customers / Users CRUD Operations
  console.log("\n── Testing Customers CRUD APIs ──");
  const listUsersRes = await fetch(`${BASE_URL}/users`);
  const listUsersData = await listUsersRes.json();
  assert(listUsersRes.status === 200, "GET /api/users returns 200");
  assert(listUsersData.users.length > 0, "Users list is populated with stats");

  const createCustomerRes = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Elena Rostova",
      email: `elena_${Date.now()}@example.com`,
      phone: "+1 (555) 432-1098",
      address: "78 Brooklyn Pier Walk",
      memberTier: "🌶 Spice Club VIP",
    }),
  });
  const createCustomerData = await createCustomerRes.json();
  assert(createCustomerRes.status === 201, "POST /api/users creates new customer");
  const newCustId = createCustomerData.user.id;

  const updateCustomerRes = await fetch(`${BASE_URL}/users/${newCustId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      memberTier: "🔥 Inferno Legend (Wholesale)",
    }),
  });
  const updateCustomerData = await updateCustomerRes.json();
  assert(updateCustomerRes.status === 200, "PUT /api/users/:id updates customer");
  assert(updateCustomerData.user.memberTier === "🔥 Inferno Legend (Wholesale)", "Customer tier updated");

  const deleteCustomerRes = await fetch(`${BASE_URL}/users/${newCustId}`, {
    method: "DELETE",
  });
  assert(deleteCustomerRes.status === 200, "DELETE /api/users/:id deletes customer");

  // 10. Contact Status and Delete Operations
  console.log("\n── Testing Contact Status & Delete APIs ──");
  const msgId = listContactData.messages[0]._id;
  const patchMsgRes = await fetch(`${BASE_URL}/contact/${msgId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "contacted" }),
  });
  const patchMsgData = await patchMsgRes.json();
  assert(patchMsgRes.status === 200, "PATCH /api/contact/:id updates status");
  assert(patchMsgData.inquiry.status === "contacted", "Message status marked as contacted");

  console.log("\n==========================================");
  console.log("🎉 ALL BACKEND API & CRUD TESTS PASSED 100%!");
  console.log("==========================================\n");
};

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
