import { useState, useEffect, useMemo } from "react";
import {
  fetchOrders,
  patchOrderStatus,
  deleteOrderPermanently,
  fetchAdminMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  fetchAdminLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  fetchContactMessages,
  patchContactStatus,
  deleteContactMessage,
} from "../utils/api";
import { showToast, updatePageTitle } from "../utils/helpers";

const Admin = ({ navigate, user }) => {
  // ── Active Navigation Section ─────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState("overview"); // overview | orders | menu | customers | locations | messages | settings
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Global Data States ───────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Filters & Search ─────────────────────────────────────────────────────
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [menuFilter, setMenuFilter] = useState("All");
  const [menuSearch, setMenuSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [messageFilter, setMessageFilter] = useState("all");

  // ── Modals State ─────────────────────────────────────────────────────────
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // ── Settings State ───────────────────────────────────────────────────────
  const [truckSettings, setTruckSettings] = useState(() => {
    const saved = localStorage.getItem("spicy_truck_settings");
    if (saved) {
      try { return JSON.parse(saved); } catch (_e) { /* fallback */ }
    }
    return {
      storeName: "Spicy Momento Food Truck",
      slogan: "Authentic Mexican Street Heat On Wheels",
      truckOpen: true,
      taxRate: 8.875,
      supportEmail: "catering@spicymomento.com",
      phone: "+1 (555) 774-2900",
      hours: "Mon - Sun: 11:00 AM - 10:00 PM",
      kitchenNote: "Order prep times are running normal (10-15 mins).",
    };
  });

  // ── Data Loader ──────────────────────────────────────────────────────────
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [ordData, menuData, custData, locData, msgData] = await Promise.all([
        fetchOrders(),
        fetchAdminMenuItems(),
        fetchCustomers(),
        fetchAdminLocations(),
        fetchContactMessages(),
      ]);
      setOrders(ordData || []);
      setMenuItems(menuData || []);
      setCustomers(custData || []);
      setLocations(locData || []);
      setMessages(msgData || []);
    } catch (err) {
      console.error("[Admin] Failed loading data:", err);
      showToast("Error connecting to backend database", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Initial Data Load ────────────────────────────────────────────────────
  useEffect(() => {
    updatePageTitle("Admin Dashboard - Spicy Momento");
    loadAllData();
  }, []);

  // ── KPI Summary Calculations ─────────────────────────────────────────────
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [orders]);

  const activeKitchenCount = useMemo(() => {
    return orders.filter(
      (o) => o.status === "confirmed" || o.status === "preparing"
    ).length;
  }, [orders]);

  const pendingInquiriesCount = useMemo(() => {
    return messages.filter((m) => m.status === "new" || !m.status).length;
  }, [messages]);

  const activeLocationsCount = useMemo(() => {
    return locations.filter((l) => l.isActive !== false).length;
  }, [locations]);

  // ── Order Operations ─────────────────────────────────────────────────────
  const handleOrderStatusChange = async (orderIdentifier, newStatus) => {
    try {
      const res = await patchOrderStatus(orderIdentifier, newStatus);
      if (res) {
        setOrders((prev) =>
          prev.map((ord) =>
            ord.orderNumber === orderIdentifier || ord._id === orderIdentifier
              ? { ...ord, status: newStatus }
              : ord
          )
        );
        showToast(`Order status updated to "${newStatus}" 🌶`);
      }
    } catch (_err) {
      showToast("Failed to update order status", "error");
    }
  };

  const handlePermanentDeleteOrder = async (id, orderNumber) => {
    if (!window.confirm(`Permanently delete order ${orderNumber}? This cannot be undone.`)) return;
    try {
      const res = await deleteOrderPermanently(id || orderNumber);
      if (res?.success) {
        setOrders((prev) => prev.filter((o) => o._id !== id && o.orderNumber !== orderNumber));
        if (selectedOrder?._id === id || selectedOrder?.orderNumber === orderNumber) {
          setSelectedOrder(null);
        }
        showToast(`Order ${orderNumber} deleted permanently`);
      }
    } catch (_err) {
      showToast("Failed to delete order", "error");
    }
  };

  // ── Menu CRUD Operations ─────────────────────────────────────────────────
  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    const form = e.target;
    const itemData = {
      name: form.name.value.trim(),
      category: form.category.value.trim(),
      price: Number(form.price.value),
      description: form.description.value.trim(),
      spiceLevel: Number(form.spiceLevel.value),
      isSpicy: Number(form.spiceLevel.value) > 0,
      bestPrice: form.bestPrice.checked,
      image: form.image.value.trim() || "/assets/images/spicy-street-tacos.jpg",
      available: form.available.checked,
    };

    if (editingMenuItem) {
      const res = await updateMenuItem(editingMenuItem.id, itemData);
      if (res?.success) {
        setMenuItems((prev) =>
          prev.map((item) => (item.id === editingMenuItem.id ? res.item : item))
        );
        showToast(`Updated '${res.item.name}' 🌶`);
      } else {
        showToast(res?.message || "Failed to update item", "error");
      }
    } else {
      const res = await createMenuItem(itemData);
      if (res?.success) {
        setMenuItems((prev) => [...prev, res.item]);
        showToast(`Added '${res.item.name}' to menu! 🌶`);
      } else {
        showToast(res?.message || "Failed to create item", "error");
      }
    }
    setMenuModalOpen(false);
    setEditingMenuItem(null);
  };

  const handleToggleMenuAvailability = async (item) => {
    const updatedStatus = !item.available;
    const res = await updateMenuItem(item.id, { available: updatedStatus });
    if (res?.success) {
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, available: updatedStatus } : i))
      );
      showToast(`${item.name} marked as ${updatedStatus ? "Available" : "Sold Out"}`);
    }
  };

  const handleDeleteMenuItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete '${item.name}'?`)) return;
    const res = await deleteMenuItem(item.id);
    if (res?.success) {
      setMenuItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast(`Deleted '${item.name}'`);
    } else {
      showToast("Failed to delete menu item", "error");
    }
  };

  // ── Locations CRUD Operations ────────────────────────────────────────────
  const handleSaveLocation = async (e) => {
    e.preventDefault();
    const form = e.target;
    const locData = {
      name: form.name.value.trim(),
      address: form.address.value.trim(),
      hours: form.hours.value.trim(),
      phone: form.phone.value.trim() || "+1 (555) 774-2900",
      isActive: form.isActive.checked,
    };

    if (editingLocation) {
      const res = await updateLocation(editingLocation.id, locData);
      if (res?.success) {
        setLocations((prev) =>
          prev.map((l) => (l.id === editingLocation.id ? res.location : l))
        );
        showToast(`Location '${res.location.name}' updated!`);
      }
    } else {
      const res = await createLocation(locData);
      if (res?.success) {
        setLocations((prev) => [...prev, res.location]);
        showToast(`New food truck stop '${res.location.name}' created! 📍`);
      }
    }
    setLocModalOpen(false);
    setEditingLocation(null);
  };

  const handleToggleLocationActive = async (loc) => {
    const newStatus = !loc.isActive;
    const res = await updateLocation(loc.id, { isActive: newStatus });
    if (res?.success) {
      setLocations((prev) =>
        prev.map((l) => (l.id === loc.id ? { ...l, isActive: newStatus } : l))
      );
      showToast(`Location '${loc.name}' ${newStatus ? "Activated" : "Deactivated"}`);
    }
  };

  const handleDeleteLocation = async (loc) => {
    if (!window.confirm(`Delete food truck location '${loc.name}'?`)) return;
    const res = await deleteLocation(loc.id);
    if (res?.success) {
      setLocations((prev) => prev.filter((l) => l.id !== loc.id));
      showToast(`Location deleted`);
    }
  };

  // ── Customers CRUD Operations ────────────────────────────────────────────
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    const form = e.target;
    const custData = {
      name: form.name.value.trim(),
      email: form.email.value.trim().toLowerCase(),
      phone: form.phone.value.trim(),
      address: form.address.value.trim(),
      memberTier: form.memberTier.value.trim(),
    };

    if (editingCustomer) {
      const res = await updateCustomer(editingCustomer.id, custData);
      if (res?.success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...res.user } : c))
        );
        showToast(`Customer '${res.user.name}' updated!`);
      }
    } else {
      const res = await createCustomer(custData);
      if (res?.success) {
        setCustomers((prev) => [res.user, ...prev]);
        showToast(`Customer '${res.user.name}' registered!`);
      } else {
        showToast(res?.message || "Failed to add customer", "error");
      }
    }
    setCustomerModalOpen(false);
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = async (cust) => {
    if (!window.confirm(`Remove customer record for '${cust.name}' (${cust.email})?`)) return;
    const res = await deleteCustomer(cust.id);
    if (res?.success) {
      setCustomers((prev) => prev.filter((c) => c.id !== cust.id));
      showToast(`Customer removed`);
    }
  };

  // ── Contact / Catering Status & Delete ───────────────────────────────────
  const handleUpdateMessageStatus = async (id, newStatus) => {
    const res = await patchContactStatus(id, newStatus);
    if (res?.success) {
      setMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status: newStatus } : m))
      );
      showToast(`Message marked as ${newStatus}`);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm("Delete this customer message?")) return;
    const res = await deleteContactMessage(id);
    if (res?.success) {
      setMessages((prev) => prev.filter((m) => m._id !== id));
      showToast("Message deleted");
    }
  };

  // ── Settings Save ────────────────────────────────────────────────────────
  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem("spicy_truck_settings", JSON.stringify(truckSettings));
    showToast("Food truck settings saved successfully! 🌶");
  };

  // ── Filtered Data Memoizations ───────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchesFilter = orderFilter === "all" ? true : ord.status === orderFilter;
      const q = orderSearch.toLowerCase().trim();
      const matchesSearch = !q
        ? true
        : (ord.orderNumber || "").toLowerCase().includes(q) ||
          (ord.customerName || "").toLowerCase().includes(q) ||
          (ord.customerEmail || "").toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [orders, orderFilter, orderSearch]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        menuFilter === "All" ? true : item.category?.toLowerCase() === menuFilter.toLowerCase();
      const q = menuSearch.toLowerCase().trim();
      const matchesSearch = !q
        ? true
        : (item.name || "").toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q) ||
          (item.category || "").toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, menuFilter, menuSearch]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const filteredMessages = useMemo(() => {
    if (messageFilter === "all") return messages;
    if (messageFilter === "catering") return messages.filter((m) => m.type === "catering");
    if (messageFilter === "contact") return messages.filter((m) => m.type === "contact");
    return messages.filter((m) => (m.status || "new") === messageFilter);
  }, [messages, messageFilter]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(menuItems.map((i) => i.category).filter(Boolean));
    return ["All", ...Array.from(cats)];
  }, [menuItems]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":   return <span className="badge badge-confirmed">Confirmed</span>;
      case "preparing":   return <span className="badge badge-preparing">🔥 Preparing</span>;
      case "delivered":   return <span className="badge badge-delivered">✅ Delivered</span>;
      case "cancelled":   return <span className="badge badge-cancelled">❌ Cancelled</span>;
      default:            return <span className="badge badge-default">{status}</span>;
    }
  };

  // Strict Protection: Admin Dashboard opens ONLY with predefined admin credentials
  if (!user || user.role !== "admin") {
    return (
      <div className="admin-protected-guard">
        <div className="guard-card">
          <div className="guard-icon">🔒</div>
          <h2>Protected Admin Dashboard</h2>
          <p className="guard-desc">
            This dashboard is restricted exclusively to authorized Spicy Momento administrators. Customers cannot access this area.
          </p>

          <div className="guard-credentials-info">
            <span className="info-title">🔑 Predefined Admin Credentials:</span>
            <div className="info-line">
              <span>User ID:</span>
              <code>admin@spicymomento.com</code> or <code>admin</code>
            </div>
            <div className="info-line">
              <span>Password:</span>
              <code>admin123</code>
            </div>
          </div>

          <div className="guard-actions">
            <button className="btn-primary guard-btn" onClick={() => navigate("login")}>
              Go to Admin Login →
            </button>
            <button className="btn-secondary guard-btn" onClick={() => navigate("home")}>
              ← Back to Customer Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* ━━━ SIDEBAR NAVIGATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-logo-area">
            <span className="brand-flame">🌶</span>
            <div>
              <h1 className="brand-title">SPICY MOMENTO</h1>
              <span className="brand-tag">ADMIN PORTAL</span>
            </div>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeSection === "overview" ? "active" : ""}`}
            onClick={() => { setActiveSection("overview"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Overview</span>
          </button>

          <button
            className={`nav-item ${activeSection === "orders" ? "active" : ""}`}
            onClick={() => { setActiveSection("orders"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📦</span>
            <span className="nav-label">Live Orders</span>
            {activeKitchenCount > 0 && (
              <span className="nav-badge hot">{activeKitchenCount}</span>
            )}
          </button>

          <button
            className={`nav-item ${activeSection === "menu" ? "active" : ""}`}
            onClick={() => { setActiveSection("menu"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">🍔</span>
            <span className="nav-label">Menu Items</span>
            <span className="nav-badge count">{menuItems.length}</span>
          </button>

          <button
            className={`nav-item ${activeSection === "customers" ? "active" : ""}`}
            onClick={() => { setActiveSection("customers"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Customers</span>
            <span className="nav-badge count">{customers.length}</span>
          </button>

          <button
            className={`nav-item ${activeSection === "locations" ? "active" : ""}`}
            onClick={() => { setActiveSection("locations"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📍</span>
            <span className="nav-label">Truck Locations</span>
            <span className="nav-badge count">{locations.length}</span>
          </button>

          <button
            className={`nav-item ${activeSection === "messages" ? "active" : ""}`}
            onClick={() => { setActiveSection("messages"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">💬</span>
            <span className="nav-label">Inquiries & Catering</span>
            {pendingInquiriesCount > 0 && (
              <span className="nav-badge alert">{pendingInquiriesCount}</span>
            )}
          </button>

          <button
            className={`nav-item ${activeSection === "settings" ? "active" : ""}`}
            onClick={() => { setActiveSection("settings"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-sidebar-back" onClick={() => navigate("home")}>
            <span>←</span> Back to Food Truck
          </button>
          <div className="admin-user-pill">
            <div className="admin-avatar">A</div>
            <div className="admin-meta">
              <strong>{user?.name || "Alex M."}</strong>
              <span>Head Manager</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ━━━ MAIN DASHBOARD CONTENT AREA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="admin-main">
        {/* TOPBAR */}
        <header className="admin-header">
          <div className="header-left">
            <button
              className="hamburger-admin-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Sidebar"
            >
              ☰
            </button>
            <div>
              <div className="admin-breadcrumb">Admin / {activeSection.toUpperCase()}</div>
              <h2 className="header-title">
                {activeSection === "overview" && "Dashboard Overview"}
                {activeSection === "orders" && "Kitchen & Customer Orders"}
                {activeSection === "menu" && "Food Menu Management"}
                {activeSection === "customers" && "Registered Customer Base"}
                {activeSection === "locations" && "Food Truck Locations & Stops"}
                {activeSection === "messages" && "Customer Inquiries & Catering"}
                {activeSection === "settings" && "Food Truck Operations & Settings"}
              </h2>
            </div>
          </div>

          <div className="header-right">
            <div
              className={`status-chip ${truckSettings.truckOpen ? "open" : "closed"}`}
              title="Click in Settings to toggle"
            >
              <span className="status-dot"></span>
              {truckSettings.truckOpen ? "TRUCK OPEN" : "TRUCK CLOSED"}
            </div>

            <button className="btn-admin-refresh" onClick={loadAllData} title="Refresh all data">
              🔄 <span>Refresh</span>
            </button>

            <button className="btn-admin-view-site" onClick={() => navigate("home")}>
              🚀 View Truck Site
            </button>
          </div>
        </header>

        {/* CONTENT CONTAINER */}
        <main className="admin-content">
          {loading ? (
            <div className="admin-loading-screen">
              <span className="loading-spinner">🌶</span>
              <p>Syncing data with MongoDB...</p>
            </div>
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════════════ */}
              {/* 1. OVERVIEW SECTION                                       */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {activeSection === "overview" && (
                <div className="overview-page">
                  {/* KPI Summary Cards */}
                  <div className="kpi-row">
                    <div className="kpi-box revenue">
                      <div className="kpi-icon-wrap">💰</div>
                      <div className="kpi-text">
                        <span className="kpi-subtitle">Total Revenue</span>
                        <h3 className="kpi-number">${totalRevenue.toFixed(2)}</h3>
                        <span className="kpi-subtext">Across {orders.length} orders</span>
                      </div>
                    </div>

                    <div className="kpi-box kitchen">
                      <div className="kpi-icon-wrap">🔥</div>
                      <div className="kpi-text">
                        <span className="kpi-subtitle">In Kitchen Queue</span>
                        <h3 className="kpi-number">{activeKitchenCount}</h3>
                        <span className="kpi-subtext">Preparing right now</span>
                      </div>
                    </div>

                    <div className="kpi-box menu-kpi">
                      <div className="kpi-icon-wrap">🍔</div>
                      <div className="kpi-text">
                        <span className="kpi-subtitle">Menu Items</span>
                        <h3 className="kpi-number">{menuItems.length}</h3>
                        <span className="kpi-subtext">{uniqueCategories.length - 1} Categories</span>
                      </div>
                    </div>

                    <div className="kpi-box customers-kpi">
                      <div className="kpi-icon-wrap">👥</div>
                      <div className="kpi-text">
                        <span className="kpi-subtitle">Total Customers</span>
                        <h3 className="kpi-number">{customers.length}</h3>
                        <span className="kpi-subtext">Registered members</span>
                      </div>
                    </div>

                    <div className="kpi-box locations-kpi">
                      <div className="kpi-icon-wrap">📍</div>
                      <div className="kpi-text">
                        <span className="kpi-subtitle">Truck Stops</span>
                        <h3 className="kpi-number">{activeLocationsCount}</h3>
                        <span className="kpi-subtext">{locations.length} total branches</span>
                      </div>
                    </div>

                    <div className="kpi-box inquiries-kpi">
                      <div className="kpi-icon-wrap">🚚</div>
                      <div className="kpi-text">
                        <span className="kpi-subtitle">Inquiries & Events</span>
                        <h3 className="kpi-number">{messages.length}</h3>
                        <span className="kpi-subtext">{pendingInquiriesCount} new messages</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="quick-actions-bar">
                    <span className="qa-label">⚡ Quick Actions:</span>
                    <button
                      className="qa-btn"
                      onClick={() => {
                        setEditingMenuItem(null);
                        setMenuModalOpen(true);
                      }}
                    >
                      ➕ Add Menu Item
                    </button>
                    <button
                      className="qa-btn"
                      onClick={() => {
                        setEditingLocation(null);
                        setLocModalOpen(true);
                      }}
                    >
                      📍 Add Truck Stop
                    </button>
                    <button
                      className="qa-btn"
                      onClick={() => {
                        setEditingCustomer(null);
                        setCustomerModalOpen(true);
                      }}
                    >
                      👤 Register Customer
                    </button>
                    <button className="qa-btn" onClick={() => setActiveSection("orders")}>
                      📦 View Kitchen Queue
                    </button>
                  </div>

                  {/* Two-Column Overview Split */}
                  <div className="overview-split">
                    {/* Left: Recent Orders */}
                    <div className="overview-panel">
                      <div className="panel-header">
                        <h4>📦 Recent Live Orders</h4>
                        <button className="btn-text" onClick={() => setActiveSection("orders")}>
                          View All ({orders.length}) →
                        </button>
                      </div>

                      {orders.length === 0 ? (
                        <p className="empty-panel-text">No orders placed yet.</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Order #</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.slice(0, 6).map((ord) => (
                                <tr key={ord._id || ord.orderNumber}>
                                  <td>
                                    <strong className="code-text">{ord.orderNumber}</strong>
                                  </td>
                                  <td>{ord.customerName}</td>
                                  <td><strong>${Number(ord.totalAmount).toFixed(2)}</strong></td>
                                  <td>{getStatusBadge(ord.status)}</td>
                                  <td>
                                    <select
                                      className="mini-select"
                                      value={ord.status}
                                      onChange={(e) =>
                                        handleOrderStatusChange(
                                          ord.orderNumber || ord._id,
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="confirmed">Confirmed</option>
                                      <option value="preparing">Preparing</option>
                                      <option value="delivered">Delivered</option>
                                      <option value="cancelled">Cancelled</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Right: Recent Inquiries & Catering */}
                    <div className="overview-panel">
                      <div className="panel-header">
                        <h4>💬 Recent Catering & Inquiries</h4>
                        <button className="btn-text" onClick={() => setActiveSection("messages")}>
                          View All ({messages.length}) →
                        </button>
                      </div>

                      {messages.length === 0 ? (
                        <p className="empty-panel-text">No inquiries received yet.</p>
                      ) : (
                        <div className="inquiry-mini-list">
                          {messages.slice(0, 4).map((msg) => (
                            <div key={msg._id} className="inquiry-mini-card">
                              <div className="mini-card-top">
                                <span
                                  className={`mini-tag ${msg.type === "catering" ? "catering" : "contact"}`}
                                >
                                  {msg.type === "catering" ? "🚚 CATERING" : "💬 QUESTION"}
                                </span>
                                <span className="mini-time">
                                  {new Date(msg.createdAt || Date.now()).toLocaleDateString()}
                                </span>
                              </div>
                              <h5 className="mini-name">{msg.name} ({msg.email})</h5>
                              {msg.type === "catering" && (
                                <div className="mini-event-info">
                                  <span>👥 {msg.guestCount || "50"} guests</span>
                                  <span>📅 {msg.eventDate || "Upcoming"}</span>
                                </div>
                              )}
                              <p className="mini-body">&ldquo;{msg.message}&rdquo;</p>
                              <div className="mini-actions">
                                {msg.status !== "contacted" ? (
                                  <button
                                    className="btn-mini-action"
                                    onClick={() => handleUpdateMessageStatus(msg._id, "contacted")}
                                  >
                                    Mark Contacted
                                  </button>
                                ) : (
                                  <span className="text-success">✓ Responded</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* 2. ORDERS SECTION                                         */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {activeSection === "orders" && (
                <div className="section-container">
                  <div className="toolbar-row">
                    <div className="search-bar">
                      <span>🔍</span>
                      <input
                        type="text"
                        placeholder="Search by order #, customer name, or email..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                      />
                    </div>

                    <div className="filter-chips">
                      {["all", "confirmed", "preparing", "delivered", "cancelled"].map((st) => (
                        <button
                          key={st}
                          className={`chip ${orderFilter === st ? "active" : ""}`}
                          onClick={() => setOrderFilter(st)}
                        >
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">📦</span>
                      <h3>No Orders Found</h3>
                      <p>Try clearing your search query or filter chips.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Order Code</th>
                            <th>Customer Info</th>
                            <th>Items Placed</th>
                            <th>Payment</th>
                            <th>Total</th>
                            <th>Date / Time</th>
                            <th>Kitchen Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((ord) => (
                            <tr key={ord._id || ord.orderNumber}>
                              <td>
                                <strong className="code-text">{ord.orderNumber}</strong>
                              </td>
                              <td>
                                <div className="cell-customer">
                                  <strong>{ord.customerName}</strong>
                                  <small>{ord.customerEmail}</small>
                                </div>
                              </td>
                              <td>
                                <span className="items-badge">
                                  {(ord.items || []).reduce(
                                    (sum, i) => sum + (i.quantity || 1),
                                    0
                                  )}{" "}
                                  items
                                </span>
                              </td>
                              <td>
                                <div className="cell-payment-admin">
                                  <span className="payment-method-text">
                                    {ord.paymentMethod === "card" && "💳 CARD"}
                                    {ord.paymentMethod === "upi" && "📱 UPI"}
                                    {ord.paymentMethod === "cod" && "💵 COD"}
                                    {!ord.paymentMethod && "💳 CARD"}
                                  </span>
                                  <span className={`payment-pill-status ${ord.paymentStatus || "paid"}`}>
                                    {(ord.paymentStatus || "paid").toUpperCase()}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <strong className="price-text">
                                  ${Number(ord.totalAmount).toFixed(2)}
                                </strong>
                              </td>
                              <td>
                                {new Date(ord.createdAt || Date.now()).toLocaleString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td>
                                <select
                                  className={`status-select ${ord.status}`}
                                  value={ord.status}
                                  onChange={(e) =>
                                    handleOrderStatusChange(
                                      ord.orderNumber || ord._id,
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="confirmed">Confirmed</option>
                                  <option value="preparing">Preparing</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="btn-icon view"
                                    title="View Order Details"
                                    onClick={() => setSelectedOrder(ord)}
                                  >
                                    👁️
                                  </button>
                                  <button
                                    className="btn-icon delete"
                                    title="Delete Order Permanently"
                                    onClick={() =>
                                      handlePermanentDeleteOrder(ord._id, ord.orderNumber)
                                    }
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* 3. MENU SECTION                                           */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {activeSection === "menu" && (
                <div className="section-container">
                  <div className="toolbar-row">
                    <div className="search-bar">
                      <span>🔍</span>
                      <input
                        type="text"
                        placeholder="Search menu by name, ingredients, or category..."
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                      />
                    </div>

                    <div className="toolbar-actions">
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setEditingMenuItem(null);
                          setMenuModalOpen(true);
                        }}
                      >
                        ➕ Add New Menu Item
                      </button>
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="category-scroll-bar">
                    {uniqueCategories.map((cat) => (
                      <button
                        key={cat}
                        className={`cat-pill ${menuFilter === cat ? "active" : ""}`}
                        onClick={() => setMenuFilter(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {filteredMenuItems.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">🍔</span>
                      <h3>No Menu Items Found</h3>
                      <p>Click "Add New Menu Item" to expand your truck offerings.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Preview</th>
                            <th>Item Name & Description</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Heat</th>
                            <th>Best Price</th>
                            <th>Available</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMenuItems.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <img
                                  src={item.image || "/assets/images/spicy-street-tacos.jpg"}
                                  alt={item.name}
                                  className="table-thumb"
                                />
                              </td>
                              <td>
                                <strong className="item-title">{item.name}</strong>
                                <p className="item-desc-text">{item.description}</p>
                              </td>
                              <td>
                                <span className="cat-badge">{item.category}</span>
                              </td>
                              <td>
                                <strong className="price-text">
                                  ${Number(item.price).toFixed(2)}
                                </strong>
                              </td>
                              <td>
                                <span className="spice-indicator" title={`Spice Level ${item.spiceLevel}/5`}>
                                  {"🌶".repeat(Math.max(item.spiceLevel || 1, 1))}
                                </span>
                              </td>
                              <td>
                                {item.bestPrice ? (
                                  <span className="badge-best-price">BEST PRICE</span>
                                ) : (
                                  <span className="badge-regular">Regular</span>
                                )}
                              </td>
                              <td>
                                <label className="switch-toggle" title="Toggle In Stock / Sold Out">
                                  <input
                                    type="checkbox"
                                    checked={item.available !== false}
                                    onChange={() => handleToggleMenuAvailability(item)}
                                  />
                                  <span className="slider round"></span>
                                </label>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="btn-icon edit"
                                    title="Edit Item"
                                    onClick={() => {
                                      setEditingMenuItem(item);
                                      setMenuModalOpen(true);
                                    }}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="btn-icon delete"
                                    title="Delete Item"
                                    onClick={() => handleDeleteMenuItem(item)}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* 4. CUSTOMERS SECTION                                      */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {activeSection === "customers" && (
                <div className="section-container">
                  <div className="toolbar-row">
                    <div className="search-bar">
                      <span>🔍</span>
                      <input
                        type="text"
                        placeholder="Search customers by name, email, or phone..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                      />
                    </div>

                    <button
                      className="btn-primary"
                      onClick={() => {
                        setEditingCustomer(null);
                        setCustomerModalOpen(true);
                      }}
                    >
                      ➕ Add Customer
                    </button>
                  </div>

                  {filteredCustomers.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">👥</span>
                      <h3>No Customers Found</h3>
                      <p>Customer registrations will appear here.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Customer</th>
                            <th>Contact Phone</th>
                            <th>Delivery Address</th>
                            <th>Member Tier</th>
                            <th>Orders</th>
                            <th>Total Spent</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCustomers.map((cust) => (
                            <tr key={cust.id || cust._id}>
                              <td>
                                <div className="cell-customer">
                                  <strong>{cust.name}</strong>
                                  <small>{cust.email}</small>
                                </div>
                              </td>
                              <td>{cust.phone || "+1 (555) 234-5678"}</td>
                              <td>
                                <span className="address-snippet">
                                  {cust.address || "123 Spice Street"}
                                </span>
                              </td>
                              <td>
                                <span className="tier-badge">{cust.memberTier}</span>
                              </td>
                              <td>
                                <strong>{cust.orderCount || 0} orders</strong>
                              </td>
                              <td>
                                <strong className="price-text">
                                  ${Number(cust.totalSpent || 0).toFixed(2)}
                                </strong>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="btn-icon edit"
                                    title="Edit Customer"
                                    onClick={() => {
                                      setEditingCustomer(cust);
                                      setCustomerModalOpen(true);
                                    }}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="btn-icon delete"
                                    title="Delete Customer"
                                    onClick={() => handleDeleteCustomer(cust)}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* 5. LOCATIONS SECTION                                      */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {activeSection === "locations" && (
                <div className="section-container">
                  <div className="toolbar-row">
                    <div>
                      <p className="section-lead">
                        Manage your active food truck parking spots, weekly schedules, and contact lines.
                      </p>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setEditingLocation(null);
                        setLocModalOpen(true);
                      }}
                    >
                      ➕ Add Food Truck Stop
                    </button>
                  </div>

                  <div className="locations-grid">
                    {locations.map((loc) => (
                      <article key={loc.id} className={`loc-card ${loc.isActive === false ? "inactive" : ""}`}>
                        <div className="loc-card-header">
                          <span className="loc-icon">📍</span>
                          <div>
                            <h4 className="loc-name">{loc.name}</h4>
                            <span className="loc-badge">Stop #{loc.id}</span>
                          </div>
                          <label className="switch-toggle" title="Active Food Truck Location">
                            <input
                              type="checkbox"
                              checked={loc.isActive !== false}
                              onChange={() => handleToggleLocationActive(loc)}
                            />
                            <span className="slider round"></span>
                          </label>
                        </div>

                        <div className="loc-details">
                          <p><strong>Address:</strong> {loc.address}</p>
                          <p><strong>Hours:</strong> {loc.hours}</p>
                          <p><strong>Hotline:</strong> {loc.phone}</p>
                        </div>

                        <div className="loc-card-footer">
                          <span className={`status-pill ${loc.isActive !== false ? "active" : "disabled"}`}>
                            {loc.isActive !== false ? "Active Stop" : "Temporarily Closed"}
                          </span>
                          <div className="action-buttons">
                            <button
                              className="btn-icon edit"
                              onClick={() => {
                                setEditingLocation(loc);
                                setLocModalOpen(true);
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn-icon delete"
                              onClick={() => handleDeleteLocation(loc)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* 6. MESSAGES & CATERING SECTION                            */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {activeSection === "messages" && (
                <div className="section-container">
                  <div className="toolbar-row">
                    <div className="filter-chips">
                      {[
                        { key: "all", label: `All (${messages.length})` },
                        { key: "catering", label: `Catering Requests (${messages.filter(m => m.type === "catering").length})` },
                        { key: "contact", label: `General Questions (${messages.filter(m => m.type === "contact").length})` },
                        { key: "new", label: `New / Unread (${pendingInquiriesCount})` },
                      ].map((item) => (
                        <button
                          key={item.key}
                          className={`chip ${messageFilter === item.key ? "active" : ""}`}
                          onClick={() => setMessageFilter(item.key)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredMessages.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">💬</span>
                      <h3>No Messages Found</h3>
                      <p>Inquiries submitted via the Contact form or Catering request will show up here.</p>
                    </div>
                  ) : (
                    <div className="messages-grid-large">
                      {filteredMessages.map((msg) => (
                        <div key={msg._id} className="msg-card-full">
                          <div className="msg-card-top">
                            <div className="msg-tags">
                              <span className={`tag-type ${msg.type === "catering" ? "catering" : "contact"}`}>
                                {msg.type === "catering" ? "🚚 CATERING REQUEST" : "💬 GENERAL INQUIRY"}
                              </span>
                              <span className={`tag-status ${msg.status || "new"}`}>
                                {(msg.status || "new").toUpperCase()}
                              </span>
                            </div>
                            <span className="msg-date">
                              {new Date(msg.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="msg-client-block">
                            <strong className="client-name">{msg.name}</strong>
                            <a href={`mailto:${msg.email}`} className="client-email">
                              📧 {msg.email}
                            </a>
                          </div>

                          {msg.type === "catering" && (
                            <div className="catering-box">
                              <div className="c-info">
                                <strong>Expected Guests:</strong> {msg.guestCount || "50"} people
                              </div>
                              <div className="c-info">
                                <strong>Preferred Event Date:</strong> {msg.eventDate || "Upcoming"}
                              </div>
                            </div>
                          )}

                          <h4 className="msg-subj">{msg.subject}</h4>
                          <p className="msg-text">&ldquo;{msg.message}&rdquo;</p>

                          <div className="msg-actions-row">
                            <div className="status-button-group">
                              <button
                                className={`btn-status ${msg.status === "reviewed" ? "active" : ""}`}
                                onClick={() => handleUpdateMessageStatus(msg._id, "reviewed")}
                              >
                                Mark Reviewed
                              </button>
                              <button
                                className={`btn-status ${msg.status === "contacted" ? "active" : ""}`}
                                onClick={() => handleUpdateMessageStatus(msg._id, "contacted")}
                              >
                                Mark Contacted
                              </button>
                            </div>

                            <button
                              className="btn-icon delete"
                              title="Delete Message"
                              onClick={() => handleDeleteMessage(msg._id)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* 7. SETTINGS SECTION                                       */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {activeSection === "settings" && (
                <div className="section-container settings-view">
                  <form onSubmit={handleSaveSettings} className="settings-form">
                    <div className="settings-panel">
                      <h3 className="panel-title">🚚 Food Truck Operations & Info</h3>
                      <p className="panel-subtitle">Configure live operating status and public contact details.</p>

                      <div className="form-group-toggle">
                        <div>
                          <strong>Truck Operating Status</strong>
                          <p>When closed, an announcement banner notifies customers ordering is paused.</p>
                        </div>
                        <label className="switch-toggle">
                          <input
                            type="checkbox"
                            checked={truckSettings.truckOpen}
                            onChange={(e) =>
                              setTruckSettings({ ...truckSettings, truckOpen: e.target.checked })
                            }
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label>Food Truck Store Name</label>
                          <input
                            type="text"
                            value={truckSettings.storeName}
                            onChange={(e) =>
                              setTruckSettings({ ...truckSettings, storeName: e.target.value })
                            }
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Brand Slogan / Tagline</label>
                          <input
                            type="text"
                            value={truckSettings.slogan}
                            onChange={(e) =>
                              setTruckSettings({ ...truckSettings, slogan: e.target.value })
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Sales Tax Rate (%)</label>
                          <input
                            type="number"
                            step="0.001"
                            value={truckSettings.taxRate}
                            onChange={(e) =>
                              setTruckSettings({
                                ...truckSettings,
                                taxRate: parseFloat(e.target.value) || 0,
                              })
                            }
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Hotline Phone Number</label>
                          <input
                            type="text"
                            value={truckSettings.phone}
                            onChange={(e) =>
                              setTruckSettings({ ...truckSettings, phone: e.target.value })
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Catering / Support Email</label>
                          <input
                            type="email"
                            value={truckSettings.supportEmail}
                            onChange={(e) =>
                              setTruckSettings({ ...truckSettings, supportEmail: e.target.value })
                            }
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Daily Operating Hours</label>
                          <input
                            type="text"
                            value={truckSettings.hours}
                            onChange={(e) =>
                              setTruckSettings({ ...truckSettings, hours: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="form-group full-width">
                        <label>Live Kitchen Status Message</label>
                        <input
                          type="text"
                          value={truckSettings.kitchenNote}
                          onChange={(e) =>
                            setTruckSettings({ ...truckSettings, kitchenNote: e.target.value })
                          }
                          placeholder="e.g. Order prep times are running normal (10-15 mins)."
                        />
                      </div>
                    </div>

                    <div className="settings-panel">
                      <h3 className="panel-title">👤 Administrator Profile</h3>
                      <div className="admin-profile-box">
                        <div className="admin-profile-avatar">A</div>
                        <div>
                          <strong>{user?.name || "Alex M."}</strong>
                          <p>{user?.email || "alex@spicymomento.com"}</p>
                          <span className="role-tag">🛡 System Administrator (Full Access)</span>
                        </div>
                      </div>
                    </div>

                    <div className="settings-footer">
                      <button type="submit" className="btn-primary-large">
                        💾 Save All Settings
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ━━━ MODAL: VIEW ORDER DETAILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-box order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details: {selectedOrder.orderNumber}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="order-meta-banner">
                <div>
                  <strong>Customer:</strong> {selectedOrder.customerName} ({selectedOrder.customerEmail})
                </div>
                <div>
                  <strong>Placed:</strong> {new Date(selectedOrder.createdAt || Date.now()).toLocaleString()}
                </div>
                <div>
                  <strong>Kitchen Status:</strong> {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <strong>Payment:</strong>{" "}
                  <span className={`payment-pill-status ${selectedOrder.paymentStatus || "paid"}`}>
                    {(selectedOrder.paymentMethod || "card").toUpperCase()} • {(selectedOrder.paymentStatus || "paid").toUpperCase()}
                  </span>
                </div>
                {selectedOrder.transactionId && (
                  <div>
                    <strong>Txn ID:</strong> <code>{selectedOrder.transactionId}</code>
                  </div>
                )}
                {selectedOrder.deliveryAddress && (
                  <div>
                    <strong>Delivery Address:</strong> {selectedOrder.deliveryAddress}
                  </div>
                )}
                {selectedOrder.phone && (
                  <div>
                    <strong>Contact Phone:</strong> {selectedOrder.phone}
                  </div>
                )}
              </div>

              <h4>Items Ordered</h4>
              <ul className="modal-items-list">
                {(selectedOrder.items || []).map((item, idx) => (
                  <li key={idx} className="modal-item-row">
                    <span>
                      <strong>{item.quantity}x</strong> {item.name}
                    </span>
                    <span>${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <div className="modal-totals-block">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>${Number(selectedOrder.subtotal || selectedOrder.totalAmount * 0.92).toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Tax (8.875%):</span>
                  <span>${Number(selectedOrder.tax || selectedOrder.totalAmount * 0.08).toFixed(2)}</span>
                </div>
                <div className="total-row grand">
                  <strong>Total Amount:</strong>
                  <strong>${Number(selectedOrder.totalAmount).toFixed(2)}</strong>
                </div>
              </div>

              {selectedOrder.specialNotes && (
                <div className="special-notes-box">
                  <strong>Customer Notes:</strong>
                  <p>&ldquo;{selectedOrder.specialNotes}&rdquo;</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
              <button
                className="btn-danger"
                onClick={() =>
                  handlePermanentDeleteOrder(selectedOrder._id, selectedOrder.orderNumber)
                }
              >
                🗑️ Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ━━━ MODAL: CREATE / EDIT MENU ITEM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {menuModalOpen && (
        <div className="modal-overlay" onClick={() => setMenuModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingMenuItem ? "Edit Menu Item" : "Add New Menu Item"}</h3>
              <button className="modal-close-btn" onClick={() => setMenuModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingMenuItem?.name || ""}
                    placeholder="e.g. Ghost Pepper Crunch Taco"
                    required
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Category *</label>
                    <select name="category" defaultValue={editingMenuItem?.category || "Tacos"} required>
                      <option value="Tacos">Tacos</option>
                      <option value="Burgers">Burgers</option>
                      <option value="Wings">Wings</option>
                      <option value="Bowls">Bowls</option>
                      <option value="Burritos">Burritos</option>
                      <option value="Sides">Sides</option>
                      <option value="Specials">Specials</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Drinks">Drinks</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      defaultValue={editingMenuItem?.price || "8.99"}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    rows="3"
                    defaultValue={editingMenuItem?.description || ""}
                    placeholder="Flavor profile, ingredients, and preparation..."
                    required
                  ></textarea>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Spice Heat Level (1 to 5)</label>
                    <input
                      type="number"
                      name="spiceLevel"
                      min="0"
                      max="5"
                      defaultValue={editingMenuItem?.spiceLevel || 1}
                    />
                  </div>

                  <div className="form-group">
                    <label>Image Asset Path</label>
                    <input
                      type="text"
                      name="image"
                      defaultValue={editingMenuItem?.image || "/assets/images/spicy-street-tacos.jpg"}
                      placeholder="/assets/images/spicy-street-tacos.jpg"
                    />
                  </div>
                </div>

                <div className="form-checkbox-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="bestPrice"
                      defaultChecked={editingMenuItem?.bestPrice || false}
                    />
                    <span>Highlight with "BEST PRICE" Badge</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="available"
                      defaultChecked={editingMenuItem ? editingMenuItem.available !== false : true}
                    />
                    <span>Available in Kitchen (In Stock)</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setMenuModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingMenuItem ? "Update Menu Item" : "Create Menu Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ━━━ MODAL: CREATE / EDIT LOCATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {locModalOpen && (
        <div className="modal-overlay" onClick={() => setLocModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingLocation ? "Edit Food Truck Stop" : "Add Food Truck Stop"}</h3>
              <button className="modal-close-btn" onClick={() => setLocModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLocation}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Location / Spot Name *</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingLocation?.name || ""}
                    placeholder="e.g. Downtown Financial Plaza"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={editingLocation?.address || ""}
                    placeholder="e.g. 100 Wall Street, New York, NY"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Operating Hours & Days *</label>
                  <input
                    type="text"
                    name="hours"
                    defaultValue={editingLocation?.hours || "Mon - Fri: 11:00 AM - 4:00 PM"}
                    placeholder="e.g. Mon - Fri: 11:00 AM - 4:00 PM"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Location Phone</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingLocation?.phone || "+1 (555) 774-2900"}
                  />
                </div>

                <div className="form-checkbox-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={editingLocation ? editingLocation.isActive !== false : true}
                    />
                    <span>Active Food Truck Stop (Open for Service)</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setLocModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingLocation ? "Save Location" : "Add Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ━━━ MODAL: CREATE / EDIT CUSTOMER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {customerModalOpen && (
        <div className="modal-overlay" onClick={() => setCustomerModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCustomer ? "Edit Customer Record" : "Add New Customer"}</h3>
              <button className="modal-close-btn" onClick={() => setCustomerModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Customer Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingCustomer?.name || ""}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingCustomer?.email || ""}
                    required
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      defaultValue={editingCustomer?.phone || "+1 (555) 234-5678"}
                    />
                  </div>

                  <div className="form-group">
                    <label>Member Tier</label>
                    <select
                      name="memberTier"
                      defaultValue={editingCustomer?.memberTier || "🌶 Spice Club VIP"}
                    >
                      <option value="🌶 Spice Club VIP">🌶 Spice Club VIP</option>
                      <option value="🌶 Spice Club Member">🌶 Spice Club Member</option>
                      <option value="🔥 Inferno Legend (Wholesale)">🔥 Inferno Legend (Wholesale)</option>
                      <option value="Regular Foodie">Regular Foodie</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Default Delivery Address</label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={editingCustomer?.address || "123 Spice Street, Foodie City"}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCustomerModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingCustomer ? "Update Customer" : "Register Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
