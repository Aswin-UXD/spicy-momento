import React, { useState } from "react";
import { showToast } from "../utils/helpers";

const PaymentModal = ({
  isOpen,
  onClose,
  cartItems,
  user,
  onCompletePayment,
  isProcessing,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("card"); // "card" | "upi" | "cod"
  const [deliveryAddress, setDeliveryAddress] = useState(
    user?.address || "123 Spice Street, Apt 4B, Foodie City"
  );
  const [phone, setPhone] = useState(user?.phone || "+1 (555) 234-5678");

  // Card Dummy Fields
  const [cardNumber, setCardNumber] = useState("4532 8821 9012 3456");
  const [cardHolder, setCardHolder] = useState(user?.name || "Spicy Foodie");
  const [expiry, setExpiry] = useState("08/28");
  const [cvv, setCvv] = useState("389");

  // UPI Dummy Fields
  const [upiId, setUpiId] = useState(
    user?.email ? `${user.email.split("@")[0]}@okhdfcbank` : "spicyfoodie@upi"
  );

  if (!isOpen) return null;

  const subtotal = (cartItems || []).reduce((acc, i) => acc + i.price * i.quantity, 0);
  const tax = subtotal * 0.08875;
  const totalAmount = Number((subtotal + tax).toFixed(2));

  const handlePay = (e) => {
    e.preventDefault();

    if (!deliveryAddress.trim()) {
      showToast("Please enter a delivery address", "error");
      return;
    }
    if (!phone.trim()) {
      showToast("Please enter a contact phone number", "error");
      return;
    }

    if (paymentMethod === "card") {
      if (cardNumber.replace(/\s/g, "").length < 12) {
        showToast("Please enter a valid card number", "error");
        return;
      }
    } else if (paymentMethod === "upi") {
      if (!upiId.includes("@")) {
        showToast("Please enter a valid UPI ID (e.g. name@upi)", "error");
        return;
      }
    }

    // Determine status and transaction ID
    const isCod = paymentMethod === "cod";
    const paymentStatus = isCod ? "pending" : "paid";
    const transactionId = isCod
      ? ""
      : `TXN-${paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`;

    onCompletePayment({
      paymentMethod,
      paymentStatus,
      transactionId,
      deliveryAddress,
      phone,
      totalAmount,
    });
  };

  return (
    <div className="payment-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="payment-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-modal-header">
          <div className="payment-modal-title">
            <span className="payment-badge-pill">Secure Gateway</span>
            <h3>🌶 Checkout & Dummy Payment</h3>
            <p>Customer: <strong>{user?.name}</strong> ({user?.email})</p>
          </div>
          <button
            className="btn-close-payment"
            onClick={onClose}
            aria-label="Close payment modal"
            disabled={isProcessing}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="payment-modal-body">
          {/* Order Summary Bar */}
          <div className="payment-summary-box">
            <div className="summary-left">
              <span className="summary-label">Items to Order</span>
              <strong className="summary-val">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items ({cartItems.length} distinct)
              </strong>
            </div>
            <div className="summary-right">
              <span className="summary-label">Total Amount</span>
              <strong className="summary-total-price">${totalAmount.toFixed(2)}</strong>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="payment-delivery-section">
            <h4 className="section-subtitle">📍 Delivery Information</h4>
            <div className="payment-form-grid">
              <div className="form-group-compact">
                <label className="compact-label">Delivery Address</label>
                <input
                  type="text"
                  className="payment-input"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street address, Apt / Suite, City"
                  required
                />
              </div>
              <div className="form-group-compact">
                <label className="compact-label">Phone Number</label>
                <input
                  type="tel"
                  className="payment-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="payment-method-selector">
            <h4 className="section-subtitle">💳 Choose Payment Method</h4>
            <div className="payment-tabs-group">
              <button
                type="button"
                className={`payment-tab-btn ${paymentMethod === "card" ? "active" : ""}`}
                onClick={() => setPaymentMethod("card")}
              >
                <span className="tab-icon">💳</span>
                <span className="tab-title">Credit / Debit Card</span>
                <span className="tab-badge">Instant</span>
              </button>

              <button
                type="button"
                className={`payment-tab-btn ${paymentMethod === "upi" ? "active" : ""}`}
                onClick={() => setPaymentMethod("upi")}
              >
                <span className="tab-icon">📱</span>
                <span className="tab-title">UPI / QR Code</span>
                <span className="tab-badge">Popular</span>
              </button>

              <button
                type="button"
                className={`payment-tab-btn ${paymentMethod === "cod" ? "active" : ""}`}
                onClick={() => setPaymentMethod("cod")}
              >
                <span className="tab-icon">💵</span>
                <span className="tab-title">Cash on Delivery</span>
                <span className="tab-badge">Pay Later</span>
              </button>
            </div>

            {/* Tab 1: Card Form */}
            {paymentMethod === "card" && (
              <div className="payment-tab-pane">
                <div className="dummy-card-preview">
                  <div className="dummy-card-chip"></div>
                  <div className="dummy-card-brand">SPICY CARD</div>
                  <div className="dummy-card-number">{cardNumber || "•••• •••• •••• ••••"}</div>
                  <div className="dummy-card-details">
                    <span>{cardHolder || "CARDHOLDER"}</span>
                    <span>{expiry || "MM/YY"}</span>
                  </div>
                </div>

                <div className="payment-form-grid">
                  <div className="form-group-compact full-col">
                    <label className="compact-label">Card Number</label>
                    <input
                      type="text"
                      className="payment-input"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4532 8821 9012 3456"
                    />
                  </div>
                  <div className="form-group-compact full-col">
                    <label className="compact-label">Cardholder Name</label>
                    <input
                      type="text"
                      className="payment-input"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="form-group-compact">
                    <label className="compact-label">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      className="payment-input"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="08/28"
                    />
                  </div>
                  <div className="form-group-compact">
                    <label className="compact-label">CVV / CVC</label>
                    <input
                      type="password"
                      maxLength={4}
                      className="payment-input"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="389"
                    />
                  </div>
                </div>
                <p className="payment-notice-info">
                  🔒 Dummy Card Simulation: Simulated transaction will instantly record as <strong>PAID</strong> in MongoDB.
                </p>
              </div>
            )}

            {/* Tab 2: UPI Form */}
            {paymentMethod === "upi" && (
              <div className="payment-tab-pane upi-pane">
                <div className="upi-qr-box">
                  <div className="dummy-qr-code">
                    <div className="qr-corner top-left"></div>
                    <div className="qr-corner top-right"></div>
                    <div className="qr-corner bottom-left"></div>
                    <div className="qr-center-icon">🌶</div>
                  </div>
                  <span className="qr-helper-text">Scan dummy QR code with any UPI app</span>
                </div>

                <div className="form-group-compact full-col" style={{ marginTop: "1rem" }}>
                  <label className="compact-label">Or Enter UPI ID</label>
                  <input
                    type="text"
                    className="payment-input"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@okhdfcbank"
                  />
                </div>
                <div className="upi-app-badges">
                  <span>Google Pay</span>
                  <span>PhonePe</span>
                  <span>Paytm</span>
                  <span>BHIM UPI</span>
                </div>
                <p className="payment-notice-info">
                  ⚡ Dummy UPI Simulation: Payment verified instantly and marked <strong>PAID</strong> in MongoDB.
                </p>
              </div>
            )}

            {/* Tab 3: COD Notice */}
            {paymentMethod === "cod" && (
              <div className="payment-tab-pane cod-pane">
                <div className="cod-info-box">
                  <span className="cod-big-icon">💵</span>
                  <h4>Cash on Delivery (COD)</h4>
                  <p>
                    Pay cash directly to our food truck delivery driver when your piping-hot meal arrives!
                  </p>
                  <ul className="cod-perks-list">
                    <li>✓ No online card or bank details required</li>
                    <li>✓ Order is placed and stored in MongoDB immediately</li>
                    <li>✓ Initial Payment Status: <strong className="status-pending-txt">PENDING</strong></li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="payment-modal-footer">
          <button
            type="button"
            className="btn-cancel-payment"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-confirm-payment"
            onClick={handlePay}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="processing-indicator">⏳ Processing Payment...</span>
            ) : paymentMethod === "cod" ? (
              <span>Confirm Order (COD) • ${totalAmount.toFixed(2)} →</span>
            ) : (
              <span>Pay ${totalAmount.toFixed(2)} Now →</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
