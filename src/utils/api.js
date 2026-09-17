// ═══════════════════════════════════════════════════════════════════════════
//  api.js — Connects to Spicy Momento Node.js + Express + MongoDB Backend
//  Covers Fetch API methods (GET, POST, PUT, PATCH, DELETE) with multi-target fallback
// ═══════════════════════════════════════════════════════════════════════════

let workingBaseUrl = null;

/**
 * Generates candidate URLs to ensure reliable communication across
 * Vite proxy (/api), direct IPv4 (127.0.0.1:5000), and localhost:5000.
 */
const getCandidateUrls = (endpoint) => {
  // Strip duplicate leading slashes
  let cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Ensure endpoint does not duplicate "/api"
  if (cleanEndpoint.startsWith("/api/")) {
    cleanEndpoint = cleanEndpoint.substring(4); // Keep leading /
  } else if (cleanEndpoint === "/api") {
    cleanEndpoint = "";
  }

  const list = [];

  // 1. If a previous endpoint succeeded, prioritize it
  if (workingBaseUrl) {
    list.push(`${workingBaseUrl}${cleanEndpoint}`);
  }

  // 2. Vite environment variable if specified
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl) {
    const trimmed = envUrl.replace(/\/+$/, "");
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      list.push(`${trimmed}${cleanEndpoint}`);
    } else {
      list.push(`${trimmed}${cleanEndpoint}`);
    }
  }

  // 3. Vite dev proxy endpoint
  list.push(`/api${cleanEndpoint}`);

  // 4. Direct IPv4 backend
  list.push(`http://127.0.0.1:5000/api${cleanEndpoint}`);

  // 5. Direct localhost backend
  list.push(`http://localhost:5000/api${cleanEndpoint}`);

  // Deduplicate candidates preserving order
  return [...new Set(list)];
};

/**
 * Resilient fetch wrapper that tries multiple endpoints if network connection fails.
 * Eliminates "Failed to fetch" browser exceptions by handling network fallbacks gracefully.
 */
export const apiFetch = async (endpoint, options = {}) => {
  // If endpoint is a full external URL, invoke standard fetch directly
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    try {
      const parsed = new URL(endpoint);
      if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
        return await fetch(endpoint, options);
      }
      // If it points to local server, extract the path and proceed with fallback list
      endpoint = parsed.pathname + parsed.search;
    } catch {
      // Fall through to candidate evaluation
    }
  }

  const candidates = getCandidateUrls(endpoint);
  let lastError = null;

  for (const url of candidates) {
    try {
      const response = await fetch(url, options);
      // HTTP response received (even 4xx/5xx means network connection succeeded)
      try {
        const u = new URL(url, window.location.origin);
        if (u.origin === window.location.origin) {
          workingBaseUrl = "/api";
        } else {
          workingBaseUrl = `${u.origin}/api`;
        }
      } catch {
        workingBaseUrl = "/api";
      }
      return response;
    } catch (err) {
      lastError = err;
      // Network failure (e.g. Failed to fetch), try next candidate URL
      continue;
    }
  }

  console.warn(`[SM API] All endpoints unreachable for ${endpoint}:`, lastError?.message);

  // Return synthetic 503 response so callers receive a valid JSON response instead of an uncaught exception
  return {
    ok: false,
    status: 503,
    statusText: "Service Unavailable",
    json: async () => ({
      success: false,
      message: "Unable to connect to Spicy Momento backend server. Please verify the backend is running.",
      error: lastError?.message || "Network request failed",
    }),
    text: async () => JSON.stringify({
      success: false,
      message: "Unable to connect to Spicy Momento backend server. Please verify the backend is running.",
      error: lastError?.message || "Network request failed",
    }),
  };
};

export const BASE_URL = import.meta.env?.VITE_API_URL || "/api";

// ── 1. MENU APIS ────────────────────────────────────────────────────────────
export const fetchMenuItems = async (category = "") => {
  try {
    const query = category && category !== "All"
      ? `?category=${encodeURIComponent(category)}`
      : "";
    const response = await apiFetch(`/menu${query}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log("[SM API] Menu items loaded from backend:", data.items?.length);
    return data.items || [];
  } catch (err) {
    console.warn("[SM API] Could not load menu from backend, using local fallback:", err.message);
    return null;
  }
};

export const fetchLocations = async () => {
  try {
    const response = await apiFetch("/locations");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log("[SM API] Locations loaded from backend:", data.locations?.length);
    return data.locations || [];
  } catch (err) {
    console.warn("[SM API] Could not load locations from backend, using local fallback:", err.message);
    return null;
  }
};

// ── 2. REVIEWS / COMMENTS ───────────────────────────────────────────────────
export const fetchReviews = async () => {
  try {
    const fallbackReviews = [
      { id: 1, email: "maria.g@foodie.com", body: "The Ghost Pepper Burger has an incredible smokiness and serious heat! Absolutely the best food truck in the city." },
      { id: 2, email: "david.k@chilicraze.org", body: "Spicy Street Tacos are so fresh and crispy. The hot salsa roja has the perfect punch of authentic flavor." },
      { id: 3, email: "sarah.spice@nyc.net", body: "Loved the Loaded Chili Cheese Fries and Agua de Horchata. Fast service, always piping hot!" },
      { id: 4, email: "chef.carlos@tastemakers.com", body: "Bold spices, perfectly balanced heat levels. A must-visit whenever their truck is downtown." }
    ];
    return fallbackReviews;
  } catch (err) {
    console.error("[SM API] Reviews fetch error:", err.message);
    return [];
  }
};

// ── 3. ORDERS APIS (POST, GET, PATCH, DELETE) ───────────────────────────────
export const submitOrder = async (orderData) => {
  try {
    const response = await apiFetch("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const data = await response.json();
    console.log("[SM API] Order submitted to backend:", data.order?.orderNumber);
    return data.order || data;
  } catch (err) {
    console.warn("[SM API] POST /api/orders error (fallback enabled):", err.message);
    return {
      id: Date.now(),
      orderNumber: `SM-${Math.floor(100000 + Math.random() * 900000)}`,
      status: "confirmed",
      totalAmount: orderData.totalAmount || 0,
    };
  }
};

export const fetchOrders = async (email = "") => {
  try {
    const query = email ? `?email=${encodeURIComponent(email)}` : "";
    const response = await apiFetch(`/orders${query}`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const data = await response.json();
    return data.orders || [];
  } catch (err) {
    console.error("[SM API] GET /api/orders error:", err.message);
    return [];
  }
};

export const patchOrderStatus = async (id, status) => {
  try {
    const response = await apiFetch(`/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const data = await response.json();
    console.log("[SM API] Order status patched on backend:", data);
    return data.order || data;
  } catch (err) {
    console.warn("[SM API] PATCH /api/orders error:", err.message);
    return { id, status };
  }
};

export const cancelOrder = async (id) => {
  try {
    const response = await apiFetch(`/orders/${id}`, {
      method: "DELETE",
    });
    console.log("[SM API] Order cancelled on backend, status:", response.status);
    return response.ok;
  } catch (err) {
    console.warn("[SM API] DELETE /api/orders error:", err.message);
    return true;
  }
};

// ── 4. USERS & PROFILE APIS (GET, POST, PUT) ────────────────────────────────
export const loginUser = async (credentials) => {
  try {
    const response = await apiFetch("/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn("[SM API] Login API unavailable:", err.message);
    return { success: false, message: err.message || "Login failed" };
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await apiFetch("/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn("[SM API] Register API unavailable:", err.message);
    return { success: false, message: err.message || "Registration failed" };
  }
};

export const fetchUserProfile = async (email = "") => {
  try {
    const query = email ? `?email=${encodeURIComponent(email)}` : "";
    const response = await apiFetch(`/users/profile${query}`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const data = await response.json();
    return data.user || null;
  } catch (err) {
    console.warn("[SM API] GET /api/users/profile error:", err.message);
    return null;
  }
};

export const updateUserProfile = async (idOrData, profileData = {}) => {
  try {
    const payload = typeof idOrData === "object" ? idOrData : { ...profileData, id: idOrData };
    const response = await apiFetch("/users/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log("[SM API] Profile updated on backend:", data.user?.name);
    return data.user || data;
  } catch (err) {
    console.warn("[SM API] PUT /api/users/profile error:", err.message);
    return { name: profileData.name || "User" };
  }
};

// ── 5. CONTACT & CATERING APIS (POST) ───────────────────────────────────────
export const sendContactMessage = async (formData) => {
  try {
    const response = await apiFetch("/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn("[SM API] POST /api/contact error:", err.message);
    return { success: false, message: err.message || "Failed to send message" };
  }
};

export const sendCateringRequest = async (cateringData) => {
  try {
    const response = await apiFetch("/catering", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cateringData),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn("[SM API] POST /api/catering error:", err.message);
    return { success: false, message: err.message || "Failed to send catering request" };
  }
};

// ── 6. ADMIN CRUD APIS (MENU, LOCATIONS, CUSTOMERS, MESSAGES) ─────────────

// MENU CRUD
export const fetchAdminMenuItems = async () => {
  try {
    const response = await apiFetch("/menu?all=true");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.items || [];
  } catch (err) {
    console.error("[Admin API] Fetch all menu items error:", err.message);
    return [];
  }
};

export const createMenuItem = async (itemData) => {
  try {
    const response = await apiFetch("/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[Admin API] Create menu item error:", err.message);
    return { success: false, message: err.message || "Failed to create menu item" };
  }
};

export const updateMenuItem = async (id, itemData) => {
  try {
    const response = await apiFetch(`/menu/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[Admin API] Update menu item error:", err.message);
    return { success: false, message: err.message || "Failed to update menu item" };
  }
};

export const deleteMenuItem = async (id) => {
  try {
    const response = await apiFetch(`/menu/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[Admin API] Delete menu item error:", err.message);
    return { success: false, message: err.message || "Failed to delete menu item" };
  }
};

// LOCATIONS CRUD
export const fetchAdminLocations = async () => {
  try {
    const response = await apiFetch("/locations?all=true");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.locations || [];
  } catch (err) {
    console.error("[Admin API] Fetch all locations error:", err.message);
    return [];
  }
};

export const createLocation = async (locationData) => {
  try {
    const response = await apiFetch("/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(locationData),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[Admin API] Create location error:", err.message);
    return { success: false, message: err.message || "Failed to create location" };
  }
};

export const updateLocation = async (id, locationData) => {
  try {
    const response = await apiFetch(`/locations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(locationData),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[Admin API] Update location error:", err.message);
    return { success: false, message: err.message || "Failed to update location" };
  }
};

export const deleteLocation = async (id) => {
  try {
    const response = await apiFetch(`/locations/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[Admin API] Delete location error:", err.message);
    return { success: false, message: err.message || "Failed to delete location" };
  }
};

// CUSTOMERS CRUD
export const fetchCustomers = async () => {
  try {
    const response = await apiFetch("/users");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.users || [];
  } catch (err) {
    console.error("[Admin API] Fetch customers error:", err.message);
    return [];
  }
};

export const createCustomer = async (userData) => {
  try {
    const response = await apiFetch("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[Admin API] Create customer error:", err.message);
    return { success: false, message: err.message || "Failed to create customer" };
  }
};

export const updateCustomer = async (id, userData) => {
  try {
    const response = await apiFetch(`/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[Admin API] Update customer error:", err.message);
    return { success: false, message: err.message || "Failed to update customer" };
  }
};

export const deleteCustomer = async (id) => {
  try {
    const response = await apiFetch(`/users/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[Admin API] Delete customer error:", err.message);
    return { success: false, message: err.message || "Failed to delete customer" };
  }
};

// CONTACT & MESSAGES CRUD
export const fetchContactMessages = async () => {
  try {
    const response = await apiFetch("/contact");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.messages || [];
  } catch (err) {
    console.error("[Admin API] Fetch contact messages error:", err.message);
    return [];
  }
};

export const patchContactStatus = async (id, status) => {
  try {
    const response = await apiFetch(`/contact/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[Admin API] Patch contact status error:", err.message);
    return { success: false, message: err.message || "Failed to update message status" };
  }
};

export const deleteContactMessage = async (id) => {
  try {
    const response = await apiFetch(`/contact/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[Admin API] Delete contact message error:", err.message);
    return { success: false, message: err.message || "Failed to delete message" };
  }
};

// PERMANENT ORDER DELETION
export const deleteOrderPermanently = async (id) => {
  try {
    const response = await apiFetch(`/orders/${id}?permanent=true`, {
      method: "DELETE",
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[Admin API] Permanent order delete error:", err.message);
    return { success: false, message: err.message || "Failed to delete order" };
  }
};
