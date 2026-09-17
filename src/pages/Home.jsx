import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CartModal from "../components/CartModal";
import PaymentModal from "../components/PaymentModal";
import heroImg from "../assets/images/hero-food.jpg";
import { menuItems, locations, weeklySpecials } from "../data/menuData";
import {
  mapMenuItems, filterMenuByCategory, getMenuSummary,
  hasSpicyItems, allHavePrice, findSpiciestIndex, logEachItem,
  getCategories, getSpiceLabel, logInfo, timeOp, inspectBranchInfo,
  updatePageTitle, showToast, smoothScrollTo, generateOrderNumber,
  calcModTotal, getTotalPrice, drainQueue, countDownFrom, extractFilled,
  IS_OPEN, branchInfo, validateEmail, manageCartDemo,
} from "../utils/helpers";
import {
  fetchReviews, submitOrder, cancelOrder, sendContactMessage,
} from "../utils/api";

const Home = ({ navigate, user, onLogout }) => {
  const [activeFilter, setActiveFilter]     = useState("All");
  const [isScrolled, setIsScrolled]         = useState(false);
  const [mousePos, setMousePos]             = useState({ x: 0, y: 0 });
  const [reviews, setReviews]               = useState([]);
  const [contactForm, setContactForm]       = useState({ name: "", email: "", subject: "", message: "" });
  const [formError, setFormError]           = useState("");
  const [lastOrder, setLastOrder]           = useState(null);
  const [isOrdering, setIsOrdering]         = useState(false);
  const [isCheckingOut, setIsCheckingOut]   = useState(false);

  // ── Cart & Payment State ───────────────────────────────────────────────────
  const [cartItems, setCartItems]           = useState([]);
  const [isCartOpen, setIsCartOpen]         = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen]   = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const categories    = ["All", ...getCategories(menuItems)];
  const enrichedItems = mapMenuItems(menuItems);
  const displayedItems = activeFilter === "All"
    ? enrichedItems
    : filterMenuByCategory(enrichedItems, activeFilter);

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    updatePageTitle("Home");

    timeOp("menu-summary", () => {
      const s = getMenuSummary(menuItems);
      logInfo("Menu Summary", s);
    });

    const info = inspectBranchInfo();
    console.log("[SM] Branch keys:", info.keys);

    logEachItem(menuItems.slice(0, 2));
    console.log("[SM] Spicy?", hasSpicyItems(menuItems), "All priced?", allHavePrice(menuItems));
    console.log("[SM] Spiciest idx:", findSpiciestIndex(menuItems));

    const total    = getTotalPrice(menuItems);
    const modTotal = calcModTotal(menuItems);
    console.log("[SM] Total:", total.toFixed(2), "ModTotal:", modTotal);

    const q       = ["order1", "order2", "order3"];
    const drained = drainQueue(q);
    console.log("[SM] Drained:", drained);

    const cd = countDownFrom(3);
    console.log("[SM] Countdown:", cd);

    const filled = extractFilled({ a: "yes", b: "", c: null, d: "ok" });
    console.log("[SM] Filled:", filled);

    manageCartDemo();

    fetchReviews().then((data) => {
      setReviews(data.slice(0, 4));
      logInfo("Reviews fetched", data.slice(0, 4));
    });

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("visible");
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    const handleWinScroll = () => {
      const top = window.scrollY || document.documentElement.scrollTop || 0;
      setIsScrolled(top > 60);
    };
    window.addEventListener("scroll", handleWinScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleWinScroll);
    };
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleScroll = (e) => {                       // onScroll
    setIsScrolled(e.target.scrollTop > 60);
  };

  const handleMouseMove = (e) => {                    // onMouseMove
    const x = (e.clientX / window.innerWidth  - 0.5) * 18;
    const y = (e.clientY / window.innerHeight - 0.5) * 18;
    setMousePos({ x, y });
  };

  const handleOrderClick = async () => {
    if (!user) {
      showToast("⚠️ Please sign in or register before placing an order!", "error");
      navigate("login");
      return;
    }
    setIsOrdering(true);
    handleAddToCart(menuItems[0]);
    setIsCartOpen(true);
    setTimeout(() => setIsOrdering(false), 500);
  };

  const handleCancelOrder = async () => {
    if (!lastOrder) return;
    const ok = await cancelOrder(lastOrder);          // DELETE
    if (ok) {
      showToast(`Order ${lastOrder} cancelled.`, "error");
      setLastOrder(null);
    }
  };

  // ── Cart Handlers ──────────────────────────────────────────────────────────
  const handleAddToCart = (item) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    showToast(`Added ${item.name} to cart! 🌶`);
  };

  const handleBuyNow = (item) => {
    if (!user) {
      showToast("⚠️ Please sign in or register before placing an order!", "error");
      navigate("login");
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setOrderConfirmed(null);
    setIsCartOpen(true);
    showToast(`Proceeding to checkout with ${item.name}! 🌶`);
  };

  const handleUpdateQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveItem = (id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
    showToast("Item removed from cart.", "error");
  };

  const handleClearCart = () => {
    setCartItems([]);
    showToast("Cart cleared.");
  };

  // Step 1: Proceed from Cart to Payment Modal (Requires Login)
  const handleCheckoutCart = () => {
    if (cartItems.length === 0) return;
    if (!user) {
      showToast("⚠️ Please sign in or register before placing an order!", "error");
      setIsCartOpen(false);
      navigate("login");
      return;
    }
    setIsCheckingOut(true);
    setIsCartOpen(false);
    setIsPaymentOpen(true);
    setIsCheckingOut(false);
  };

  // Step 2: Complete Dummy Payment & Persist in MongoDB
  const handleCompletePayment = async (paymentData) => {
    setIsProcessingPayment(true);

    const subtotal = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const tax = subtotal * 0.08875;
    const totalAmount = Number((subtotal + tax).toFixed(2));

    const orderPayload = {
      customerName: user?.name || "Spicy Foodie",
      customerEmail: user?.email,
      items: cartItems.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      totalAmount,
      paymentMethod: paymentData.paymentMethod,
      paymentStatus: paymentData.paymentStatus,
      transactionId: paymentData.transactionId,
      deliveryAddress: paymentData.deliveryAddress,
      phone: paymentData.phone,
    };

    const savedOrder = await submitOrder(orderPayload);
    const orderNum = savedOrder?.orderNumber || generateOrderNumber();

    setOrderConfirmed({
      orderNumber: orderNum,
      itemCount: cartItems.reduce((acc, i) => acc + i.quantity, 0),
      paymentMethod: paymentData.paymentMethod,
      paymentStatus: paymentData.paymentStatus,
      transactionId: paymentData.transactionId,
      deliveryAddress: paymentData.deliveryAddress,
      totalAmount,
    });

    setCartItems([]);
    setIsProcessingPayment(false);
    setIsPaymentOpen(false);
    setIsCartOpen(true); // Re-open cart drawer to show order confirmed ticket!
    showToast(`Order ${orderNum} confirmed! Payment: ${paymentData.paymentStatus.toUpperCase()} 🌶`);
  };

  const handleContactChange = (e) => {               // onChange
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError("");
  };

  const handleContactSubmit = async (e) => {         // onSubmit
    e.preventDefault();
    const { name, email, subject, message } = contactForm;
    if (!name.trim() || !email.trim() || !message.trim()) {
      setFormError("Please fill all required fields.");
      return;
    }
    if (!validateEmail(email)) {
      setFormError("Enter a valid email address.");
      return;
    }
    setFormError("");

    // Submit to real MongoDB backend
    await sendContactMessage({
      name: name.trim(),
      email: email.trim(),
      subject: subject?.trim() || "Website Contact",
      message: message.trim(),
    });
    showToast("Message sent! Our food truck team will get back to you. 🌶");
    setContactForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="home-page" onScroll={handleScroll}>
      <Navbar
        navigate={navigate}
        user={user}
        onLogout={onLogout}
        isScrolled={isScrolled}
        onNavClick={smoothScrollTo}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => {
          setOrderConfirmed(null);
          setIsCartOpen(true);
        }}
      />

      <main>
        {/* ━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="home" className="hero-section" onMouseMove={handleMouseMove}>
          <div
            className="hero-overlay"
            style={{
              background: `radial-gradient(circle at ${50 + mousePos.x}% ${50 + mousePos.y}%, rgba(74,14,8,0.92) 0%, rgba(0,0,0,0.62) 100%)`,
            }}
          />

          <div className="hero-content page-container reveal">
            <span className="hero-badge">
              <strong>🌶 Est. {branchInfo.founded}</strong>{" "}
              &bull; {IS_OPEN ? "Open Now 🟢" : "Closed 🔴"}
            </span>
            <h1 className="hero-title">
              <em>Feel</em> the<br /><strong>Heat.</strong>
            </h1>
            <p className="hero-subtitle">
              Fresh ingredients. Bold flavors. Heat levels from{" "}
              <em>mild</em> to <strong>ghost pepper</strong> — always on
              wheels, always fresh.
            </p>
            <div className="hero-actions">
              <button
                className="btn-primary"
                onClick={handleOrderClick}
                onMouseEnter={() => console.log("[SM] Order hovered")}
                onMouseLeave={() => console.log("[SM] Order left")}
                disabled={isOrdering}
              >
                {isOrdering ? "Placing..." : "🌶 Order Now"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => smoothScrollTo("menu")}
              >
                View Menu
              </button>
              {lastOrder && (
                <button
                  className="btn-secondary"
                  onClick={handleCancelOrder}
                  style={{ borderColor: "rgba(255,100,100,0.7)", fontSize: "0.8rem" }}
                >
                  Cancel {lastOrder}
                </button>
              )}
            </div>
          </div>

          {/* Responsive hero picture element using local asset */}
          <div className="hero-pic-container">
            <picture>
              <source
                media="(min-width: 1200px)"
                srcSet={heroImg}
              />
              <source
                media="(min-width: 768px)"
                srcSet={heroImg}
              />
              <img
                className="hero-pic-img"
                src={heroImg}
                alt="Spicy Momento delicious food"
              />
            </picture>
          </div>
        </section>

        {/* ━━━ MENU ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="menu" className="section menu-section">
          <div className="page-container">
            <div className="section-header reveal">
              <h2 className="section-title">Our Menu</h2>
              <p className="section-subtitle">
                From <em>mild</em> to <strong>dangerously hot</strong>
              </p>
            </div>

            <div className="menu-filters">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`filter-btn${activeFilter === cat ? " active" : ""}`}
                  onClick={() => setActiveFilter(cat)}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="menu-grid">
              {displayedItems.map((item) => (
                <article key={item.id} className="menu-card">
                  <div className="menu-card-img-wrap">
                    <img
                      src={item.imgUrl}
                      alt={item.name}
                      className="menu-card-img"
                      loading="eager"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = heroImg;
                      }}
                    />
                    {item.bestPrice && (
                      <span className="best-price-badge">🏷️ Best Price</span>
                    )}
                  </div>
                  <div className="menu-card-body">
                    <h3 className="menu-card-title">{item.emoji} {item.name}</h3>
                    <p className="menu-card-desc">{item.description}</p>
                    <div className="menu-card-footer">
                      <div className="price-tag-wrap">
                        <strong className="menu-price">{item.displayPrice}</strong>
                        {item.bestPrice && <span className="price-sub-label">Best Deal</span>}
                      </div>
                      <span className="spice-badge">{getSpiceLabel(item.spiceLevel)}</span>
                    </div>

                    {/* Action buttons: Add to Cart and Buy Now */}
                    <div className="menu-card-actions">
                      <button
                        className="btn-card-cart"
                        onClick={() => handleAddToCart(item)}
                        aria-label={`Add ${item.name} to cart`}
                      >
                        Add to Cart
                      </button>
                      <button
                        className="btn-card-buy"
                        onClick={() => handleBuyNow(item)}
                        aria-label={`Buy ${item.name} now`}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Weekly Specials — ol */}
            <div className="specials-wrapper reveal">
              <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>
                🔥 Weekly Specials
              </h2>
              <ol className="specials-list">
                {weeklySpecials.map((s) => (
                  <li key={s.id} className="special-item">
                    <strong>{s.name}</strong>
                    {" — "}
                    <span style={{ textDecoration: "line-through", opacity: 0.5 }}>
                      ${s.originalPrice.toFixed(2)}
                    </span>
                    {" "}
                    <strong style={{ color: "var(--white)" }}>${s.specialPrice.toFixed(2)}</strong>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ━━━ LOCATIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="locations" className="section locations-section">
          <div className="page-container">
            <div className="section-header reveal">
              <h2 className="section-title">Find Us</h2>
              <p className="section-subtitle">We bring the heat to your neighborhood</p>
            </div>

            <div className="locations-grid">
              {locations.map((loc) => (
                <div key={loc.id} className="location-card reveal">
                  <h3>📍 {loc.name}</h3>
                  <p><strong>Address:</strong> {loc.address}</p>
                  <p><strong>Hours:</strong> {loc.hours}</p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    <a href={`tel:${loc.phone}`} style={{ color: "inherit" }}>
                      {loc.phone}
                    </a>
                  </p>
                </div>
              ))}
            </div>

            {/* Google Maps iframe */}
            <div className="map-container reveal">
              <iframe
                src="https://maps.google.com/maps?q=New+York+City&output=embed&z=13"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Spicy Momento Locations Map"
              />
            </div>
          </div>
        </section>

        {/* ━━━ ABOUT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="about" className="section about-section">
          <div className="page-container">
            <div className="section-header reveal">
              <h2 className="section-title">About Us</h2>
            </div>

            <div className="about-layout">
              <div className="about-main reveal">
                <p className="about-text">
                  <strong>Spicy Momento</strong> was born from a{" "}
                  <em>passion</em> for authentic street food with a fiery
                  twist. Founded in <strong>{branchInfo.founded}</strong>, we
                  set out to bring bold flavors directly to the streets.
                </p>
                <p className="about-text">
                  Every dish is crafted with fresh, locally-sourced ingredients
                  and our signature <em>Momento Sauce</em> — a family recipe
                  perfected over generations of food-truck love.
                </p>
                <p className="about-text">
                  From <strong>ghost pepper burgers</strong> to{" "}
                  <strong>mild rice bowls</strong>, we cater to every heat
                  level. Street food should be exciting, accessible, and always{" "}
                  <em>memorable</em>.
                </p>

                <h3 style={{ fontFamily: "var(--font-h)", marginBottom: "0.75rem", marginTop: "1.5rem" }}>
                  Customer Reviews
                </h3>
                <div className="reviews-scroll">
                  {reviews.length > 0 ? (
                    reviews.map((r) => (
                      <div key={r.id} className="review-card">
                        <strong style={{ color: "var(--white)" }}>{r.email}</strong>
                        <p style={{ marginTop: "0.4rem" }}>{r.body.slice(0, 120)}...</p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "var(--w60)", fontSize: "0.88rem", padding: "1rem" }}>
                      Loading reviews...
                    </p>
                  )}
                </div>
              </div>

              {/* ASIDE — Quick Facts */}
              <aside className="about-aside reveal">
                <h3>🌶 Quick Facts</h3>
                <ul>
                  {[
                    { label: "Founded",    val: branchInfo.founded },
                    { label: "Trucks",     val: `${locations.length} Active` },
                    { label: "Menu Items", val: `${menuItems.length}+` },
                    { label: "Rating",     val: `⭐ ${branchInfo.rating}` },
                    { label: "City",       val: branchInfo.city },
                    { label: "Status",     val: IS_OPEN ? "🟢 Open" : "🔴 Closed" },
                  ].map((item) => (
                    <li key={item.label}>
                      <span>{item.label}</span>
                      <span className="stat-value">{item.val}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </div>
        </section>

        {/* ━━━ CONTACT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="contact" className="section contact-section">
          <div className="page-container">
            <div className="section-header reveal">
              <h2 className="section-title">Contact Us</h2>
              <p className="section-subtitle">Got a question? We love hearing from you.</p>
            </div>

            <form className="contact-form reveal" onSubmit={handleContactSubmit} noValidate>
              {formError && <p className="error-msg">{formError}</p>}

              <div className="form-group">
                <label className="form-label" htmlFor="c-name">Your Name *</label>
                <input
                  id="c-name"
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="John Doe"
                  value={contactForm.name}
                  onChange={handleContactChange}
                  onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                  onKeyUp={(e) => console.log("[SM] Name length:", e.target.value.length)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="c-email">Email Address *</label>
                <input
                  id="c-email"
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="c-subject">Subject</label>
                <select
                  id="c-subject"
                  name="subject"
                  className="form-select"
                  value={contactForm.subject}
                  onChange={handleContactChange}
                >
                  <option value="">-- Select a subject --</option>
                  <option value="order">Order Inquiry</option>
                  <option value="catering">Catering Request</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="c-message">Message *</label>
                <textarea
                  id="c-message"
                  name="message"
                  className="form-textarea"
                  placeholder="Tell us what is on your mind..."
                  value={contactForm.message}
                  onChange={handleContactChange}
                  rows={5}
                  required
                />
              </div>

              <button type="submit" className="btn-full">
                Send Message 🌶
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer navigate={navigate} />

      {/* Cart Drawer / Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => {
          setIsCartOpen(false);
          setOrderConfirmed(null);
        }}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onCheckout={handleCheckoutCart}
        isCheckingOut={isCheckingOut}
        orderConfirmed={orderConfirmed}
      />

      {/* Dummy Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        cartItems={cartItems}
        user={user}
        onCompletePayment={handleCompletePayment}
        isProcessing={isProcessingPayment}
      />

      <button
        className="back-to-top"
        onClick={() => smoothScrollTo("home")}
        aria-label="Back to top"
      >
        &uarr;
      </button>
    </div>
  );
};

export default Home;
