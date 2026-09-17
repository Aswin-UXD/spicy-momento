import { useState } from "react";
import { validateEmail, validatePassword, saveUserSession, showToast, updatePageTitle } from "../utils/helpers";
import { loginUser } from "../utils/api";

const Login = ({ navigate, onLogin }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Update page title on mount via useEffect-like call at component level
  if (typeof document !== "undefined") {
    updatePageTitle("Login");
  }

  const handleChange = (e) => {          // onChange
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleKeyDown = (e) => {        // onKeyDown
    if (e.key === "Enter") {
      e.currentTarget.form?.requestSubmit?.();
    }
  };

  const handleSubmit = async (e) => {   // onSubmit
    e.preventDefault();

    const { email, password } = form;

    // Validate
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    const passCheck = validatePassword(password);
    if (!passCheck.valid) {
      setError(passCheck.msg);
      return;
    }

    setLoading(true);
    setError("");

    // Authenticate strictly with MongoDB backend
    const apiRes = await loginUser({ email: email.trim().toLowerCase(), password });

    if (!apiRes || !apiRes.success || !apiRes.user) {
      setError(apiRes?.message || "Invalid credentials. Please register first or check your details.");
      setLoading(false);
      return;
    }

    const userData = {
      name: apiRes.user.name,
      email: apiRes.user.email,
      memberTier: apiRes.user.memberTier,
      phone: apiRes.user.phone,
      address: apiRes.user.address,
      role: apiRes.user.role || (apiRes.user.email === "admin@spicymomento.com" ? "admin" : "customer"),
      loggedInAt: Date.now(),
    };

    saveUserSession(userData);
    showToast(userData.role === "admin" ? `Welcome Admin ${userData.name}! 👑` : `Welcome back, ${userData.name}! 🌶`);
    onLogin(userData);
    setLoading(false);
  };

  const fillAdmin = () => {
    setForm({ email: "admin@spicymomento.com", password: "admin123" });
    setError("");
  };

  const fillCustomer = () => {
    setForm({ email: "alex@spicymomento.com", password: "password123" });
    setError("");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">🌶 Login</h1>
        <p className="auth-subtitle">Welcome back to Spicy Momento</p>

        {/* Quick Credentials Info */}
        <div className="auth-credentials-hint">
          <div className="hint-header">
            <span>🔑 Demo Credentials:</span>
          </div>
          <div className="hint-buttons">
            <button type="button" className="btn-hint-tag admin" onClick={fillAdmin}>
              👑 Admin (admin@spicymomento.com)
            </button>
            <button type="button" className="btn-hint-tag customer" onClick={fillCustomer}>
              🌮 Customer (alex@spicymomento.com)
            </button>
          </div>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address or User ID
            </label>
            <input
              id="login-email"
              type="text"
              name="email"
              className="form-input"
              placeholder="you@example.com or admin"
              value={form.email}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              name="password"
              className="form-input"
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "CapsLock") {
                  console.log("[SM] Caps Lock pressed on password field");
                }
              }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-full"
            disabled={loading}
          >
            {loading ? "Verifying Credentials..." : "Login →"}
          </button>
        </form>

        <div className="auth-link">
          <p>
            Don&apos;t have an account?{" "}
            <button onClick={() => navigate("register")}>Register here</button>
          </p>
          <p style={{ marginTop: "0.5rem" }}>
            <button onClick={() => navigate("welcome")}>← Back to Welcome</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
