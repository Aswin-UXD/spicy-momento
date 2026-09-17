import { useState } from "react";
import { validateEmail, validatePassword, formatName, saveUserSession, showToast, updatePageTitle, getInitials } from "../utils/helpers";
import { registerUser } from "../utils/api";

const Register = ({ navigate, onLogin }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    source: "",
    note: "",
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);

  if (typeof document !== "undefined") {
    updatePageTitle("Register");
  }

  const handleChange = (e) => {         // onChange
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "note") setCharCount(value.length);
  };

  const handleKeyUp = (e) => {         // onKeyUp
    const { name, value } = e.target;
    if (name === "email") {
      console.log("[SM] Email field length:", value.length);
    }
    if (name === "name") {
      console.log("[SM] Initials preview:", getInitials(value || "?"));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())    errs.name    = "Name is required.";
    if (!validateEmail(form.email)) errs.email = "Valid email required.";
    const passCheck = validatePassword(form.password);
    if (!passCheck.valid)     errs.password = passCheck.msg;
    if (form.password !== form.confirm) errs.confirm = "Passwords do not match.";
    return errs;
  };

  const handleSubmit = async (e) => {   // onSubmit
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);

    // Register with MongoDB backend
    const apiRes = await registerUser({
      name: formatName(form.name),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });

    if (!apiRes || !apiRes.success || !apiRes.user) {
      setErrors({ email: apiRes?.message || "Registration failed. Please try again." });
      setLoading(false);
      return;
    }

    const userData = {
      name: apiRes.user.name,
      email: apiRes.user.email,
      memberTier: apiRes.user.memberTier || "🌶 Spice Club Member",
      role: apiRes.user.role || "customer",
      phone: apiRes.user.phone || "+1 (555) 234-5678",
      address: apiRes.user.address || "123 Spice Street, Apt 4B, Foodie City",
      registeredAt: Date.now(),
    };

    saveUserSession(userData);
    setSuccess(`Account created! Welcome, ${userData.name}! 🌶`);
    showToast(`🌶 Welcome, ${userData.name}!`);
    setTimeout(() => onLogin(userData), 1000);
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "540px" }}>
        <h1 className="auth-title">🌶 Register</h1>
        <p className="auth-subtitle">Join the Spicy Momento family</p>

        {success && <p className="success-msg">{success}</p>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              name="name"
              className="form-input"
              placeholder="Jane Doe"
              value={form.name}
              onChange={handleChange}
              onKeyUp={handleKeyUp}
              required
            />
            {errors.name && <p className="error-msg" style={{ marginTop: "0.4rem" }}>{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              name="email"
              className="form-input"
              placeholder="jane@example.com"
              value={form.email}
              onChange={handleChange}
              onKeyUp={handleKeyUp}
              required
            />
            {errors.email && <p className="error-msg" style={{ marginTop: "0.4rem" }}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              name="password"
              className="form-input"
              placeholder="Min 8 chars, 1 number, 1 uppercase"
              value={form.password}
              onChange={handleChange}
              onKeyDown={(e) => console.log("[SM] Reg key down:", e.key)}
              required
            />
            {errors.password && <p className="error-msg" style={{ marginTop: "0.4rem" }}>{errors.password}</p>}
          </div>

          {/* Confirm */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              name="confirm"
              className="form-input"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={handleChange}
              required
            />
            {errors.confirm && <p className="error-msg" style={{ marginTop: "0.4rem" }}>{errors.confirm}</p>}
          </div>

          {/* Source dropdown */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-source">How did you find us?</label>
            <select
              id="reg-source"
              name="source"
              className="form-select"
              value={form.source}
              onChange={handleChange}
            >
              <option value="">-- Select --</option>
              <option value="social">Social Media</option>
              <option value="friend">Friend / Family</option>
              <option value="search">Google Search</option>
              <option value="event">Local Event</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Note / Special request — textarea */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-note">
              Dietary notes / Special requests
              <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}> ({charCount}/200)</span>
            </label>
            <textarea
              id="reg-note"
              name="note"
              className="form-textarea"
              placeholder="Allergies, preferences..."
              value={form.note}
              onChange={handleChange}
              maxLength={200}
              rows={3}
            />
          </div>

          <button type="submit" className="btn-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        <div className="auth-link">
          <p>
            Already have an account?{" "}
            <button onClick={() => navigate("login")}>Login here</button>
          </p>
          <p style={{ marginTop: "0.5rem" }}>
            <button onClick={() => navigate("welcome")}>← Back to Welcome</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
