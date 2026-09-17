import { useState, useEffect } from "react";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import { getUserSession } from "./utils/helpers";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = getUserSession();
    if (saved) {
      setUser(saved);
    }
    console.log("[SM] App initialized");
  }, []);

  const navigate = (page) => setCurrentPage(page);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData?.role === "admin") {
      navigate("admin");
    } else {
      navigate("home");
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate("welcome");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "welcome":  return <Welcome navigate={navigate} />;
      case "login":    return <Login navigate={navigate} onLogin={handleLogin} />;
      case "register": return <Register navigate={navigate} onLogin={handleLogin} />;
      case "home":     return <Home navigate={navigate} user={user} onLogout={handleLogout} />;
      case "admin":
        if (user?.role === "admin") {
          return <Admin navigate={navigate} user={user} onLogout={handleLogout} />;
        }
        return <Login navigate={navigate} onLogin={handleLogin} />;
      default:         return <Welcome navigate={navigate} />;
    }
  };

  return <div className="app">{renderPage()}</div>;
}

export default App;
