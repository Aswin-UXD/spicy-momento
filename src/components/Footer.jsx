const Footer = ({ navigate }) => {
  const year = new Date().getFullYear();

  const quickLinks = ["HOME", "MENU", "LOCATIONS", "ABOUT", "CONTACT"];
  const socials = ["Instagram", "Facebook", "TikTok", "Twitter"];

  return (
    <footer className="site-footer">
      <div className="page-container">
        <div className="footer-grid">

          {/* Brand column */}
          <div>
            <p className="footer-brand">🌶 SPICY MOMENTO</p>
            <p className="footer-desc">
              Authentic street food with a fiery kick. Fresh ingredients, bold
              flavors, and a heat level for every soul — on wheels, near you.
            </p>
            <address className="footer-address">
              <strong>Headquarters:</strong><br />
              123 Chili Street, Downtown<br />
              Flavor Town, FT 10001<br />
              <a href="tel:+15551234567" style={{ color: "inherit" }}>
                +1 (555) 123-4567
              </a>
            </address>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-links">
              {quickLinks.map((link) => (
                <li key={link}>
                  <a
                    role="button"
                    onClick={() => navigate && navigate("home")}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && navigate && navigate("home")}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="footer-heading">Follow Us</h3>
            <ul className="footer-links">
              {socials.map((s) => (
                <li key={s}>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <small className="footer-copy">
            &copy; {year} <strong>Spicy Momento</strong>. All rights reserved.
          </small>
          <p className="footer-copy">
            <em>Made with 🌶 and passion.</em>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
