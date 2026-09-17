import { useState, useEffect, useRef } from "react";
import { getInitials, showToast } from "../utils/helpers";
import { fetchUserProfile, fetchOrders } from "../utils/api";

const Navbar = ({ navigate, user, onLogout, isScrolled, onNavClick, cartCount = 0, onOpenCart }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [hoveredItem, setHoveredItem] = useState(null);
  const profileRef = useRef(null);

  const userName = user?.name || "Alex M.";
  const userEmail = user?.email || "alex@spicymomento.com";
  const userInitials = getInitials(userName) || "AM";

  const navLinks = [
    { label: "HOME",      id: "home" },
    { label: "MENU",      id: "menu" },
    { label: "LOCATIONS", id: "locations" },
    { label: "ABOUT",     id: "about" },
    { label: "CONTACT",   id: "contact" },
  ];

  // ── Keyboard & Click-Outside Handlers ─────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ── Scroll Spy for Active Navigation ──────────────────────────────────────
  useEffect(() => {
    const handleScrollSpy = () => {
      const sectionIds = ["home", "menu", "locations", "about", "contact"];
      const scrollPos = (window.scrollY || document.documentElement.scrollTop || 0) + 120;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScrollSpy, { passive: true });
    handleScrollSpy();
    return () => window.removeEventListener("scroll", handleScrollSpy);
  }, []);

  const handleNavClick = (id) => {
    setActiveSection(id);
    if (onNavClick) onNavClick(id);
    setMenuOpen(false);
    setProfileOpen(false);
  };

  const handleProfileOption = async (type) => {
    setProfileOpen(false);
    setMenuOpen(false);

    if (type === "profile") {
      const profile = await fetchUserProfile(userEmail);
      if (profile) {
        showToast(`👤 ${profile.name} • ${profile.memberTier} • ${profile.email}`);
      } else {
        showToast(`👤 Profile: ${userName} (${userEmail})`);
      }
    } else if (type === "orders") {
      const orders = await fetchOrders(userEmail);
      if (orders && orders.length > 0) {
        const latest = orders[0];
        showToast(`📦 Orders (${orders.length}): Latest ${latest.orderNumber} (${latest.status}) - $${latest.totalAmount.toFixed(2)}`);
      } else {
        showToast("📦 Recent Orders: #SM-9482 (Delivered)");
      }
    } else if (type === "settings") {
      showToast("⚙️ Preferences: Notifications Active • Delivery: Default Address");
    } else if (type === "admin") {
      if (navigate) navigate("admin");
    } else if (type === "logout") {
      showToast("Logging out... See you soon! 🌶");
      if (onLogout) onLogout();
    }
  };

  return (
    <header className="site-header">
      <nav className={`navbar${isScrolled ? " scrolled" : ""}`}>
        {/* Brand */}
        <div
          className="navbar-brand"
          onClick={() => handleNavClick("home")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter") handleNavClick("home"); }}
        >
          <span className="brand-icon">🌶</span>
          <span className="brand-name">SPICY MOMENTO</span>
        </div>

        {/* Central Nav Links - Clean food brand navigation */}
        <ul className={`navbar-nav${menuOpen ? " open" : ""}`}>
          {/* Mobile Profile Banner inside mobile drawer */}
          {user ? (
            <li className="mobile-user-card">
              <div className="mobile-avatar">{userInitials}</div>
              <div className="mobile-user-info">
                <strong>{userName}</strong>
                <span>{userEmail}</span>
                {user?.role === "admin" && <span className="admin-tag-pill">👑 Admin</span>}
              </div>
            </li>
          ) : (
            <li className="mobile-guest-card">
              <button className="btn-mobile-signin" onClick={() => { setMenuOpen(false); navigate("login"); }}>
                🔑 Sign In / Register
              </button>
            </li>
          )}

          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <li key={link.id} className="nav-item">
                <button
                  className={`nav-link${isActive ? " active" : ""}`}
                  onClick={() => handleNavClick(link.id)}
                  onMouseEnter={() => setHoveredItem(link.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                  {hoveredItem === link.id && ""}
                </button>
              </li>
            );
          })}

          {/* Mobile Profile Actions inside drawer */}
          {user && (
            <li className="mobile-profile-links">
              <button className="mobile-sublink" onClick={() => handleProfileOption("profile")}>
                👤 Profile
              </button>
              <button className="mobile-sublink" onClick={() => handleProfileOption("orders")}>
                📦 My Orders
              </button>
              <button className="mobile-sublink" onClick={() => handleProfileOption("settings")}>
                ⚙️ Settings
              </button>
              {user?.role === "admin" && (
                <button className="mobile-sublink mobile-admin-link" onClick={() => handleProfileOption("admin")}>
                  🛠 Admin Dashboard
                </button>
              )}
              <button className="mobile-sublink mobile-logout" onClick={() => handleProfileOption("logout")}>
                🚪 Logout
              </button>
            </li>
          )}
        </ul>

        {/* Right Actions: Cart, Profile Menu, and Primary Order CTA */}
        <div className="navbar-actions">
          {/* Cart Button with Live Counter Badge */}
          <button
            className="btn-cart"
            onClick={onOpenCart}
            aria-label={`Shopping cart with ${cartCount} items`}
            title="View Cart"
          >
            <span className="cart-icon-nav">🛒</span>
            <span className="cart-text-nav">CART</span>
            <span className="cart-badge-count">{cartCount}</span>
          </button>

          {/* User Profile or Sign In Button */}
          {user ? (
            <div className="profile-menu-container" ref={profileRef}>
              <button
                className={`btn-profile-trigger${profileOpen ? " active" : ""}`}
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-expanded={profileOpen}
                aria-haspopup="true"
                aria-label="User account menu"
                title={`Account: ${userName}`}
              >
                <div className="profile-avatar-circle">
                  <span>{userInitials}</span>
                  <span className="profile-status-dot" aria-hidden="true" />
                </div>
                <span className="profile-user-name">{userName}</span>
                <span className={`profile-chevron${profileOpen ? " rotated" : ""}`}>▾</span>
              </button>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <div className="profile-dropdown-menu" role="menu" aria-label="User account options">
                  <div className="dropdown-user-header">
                    <div className="dropdown-avatar-large">
                      <span>{userInitials}</span>
                    </div>
                    <div className="dropdown-user-details">
                      <strong className="dropdown-user-name">{userName}</strong>
                      <span className="dropdown-user-email">{userEmail}</span>
                      <span className="dropdown-user-badge">
                        {user?.role === "admin" ? "👑 Admin Access" : "🌶 Spice Club VIP"}
                      </span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <button
                    className="dropdown-item"
                    onClick={() => handleProfileOption("profile")}
                    role="menuitem"
                  >
                    <span className="dropdown-icon">👤</span>
                    <span className="dropdown-label">Profile</span>
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => handleProfileOption("orders")}
                    role="menuitem"
                  >
                    <span className="dropdown-icon">📦</span>
                    <span className="dropdown-label">My Orders</span>
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => handleProfileOption("settings")}
                    role="menuitem"
                  >
                    <span className="dropdown-icon">⚙️</span>
                    <span className="dropdown-label">Settings</span>
                  </button>

                  {/* Admin link visible ONLY to users with role === 'admin' */}
                  {user?.role === "admin" && (
                    <button
                      className="dropdown-item dropdown-item-admin"
                      onClick={() => handleProfileOption("admin")}
                      role="menuitem"
                    >
                      <span className="dropdown-icon">🛠</span>
                      <span className="dropdown-label">Admin Dashboard</span>
                    </button>
                  )}

                  <div className="dropdown-divider" />

                  <button
                    className="dropdown-item dropdown-item-logout"
                    onClick={() => handleProfileOption("logout")}
                    role="menuitem"
                  >
                    <span className="dropdown-icon">🚪</span>
                    <span className="dropdown-label">Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="btn-signin-nav"
              onClick={() => navigate("login")}
              title="Sign in or register"
            >
              SIGN IN
            </button>
          )}

          {/* Primary CTA: ORDER NOW */}
          <button
            className="btn-order"
            onClick={() => handleNavClick("menu")}
            title="Explore our spicy menu & order"
          >
            ORDER NOW
          </button>

          {/* Hamburger (mobile) */}
          <button
            className={`hamburger${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="Toggle navigation menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
