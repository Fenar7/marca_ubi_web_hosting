const quickLinks = [
  { label: "Home", href: "#" },
  { label: "About", href: "#" },
  { label: "Works", href: "#" },
  { label: "Contact", href: "#" },
  { label: "Testimonial", href: "#" },
];

const socialLinks = [
  { name: "Instagram", href: "#", icon: "/images/instagram.svg" },
  { name: "Facebook", href: "#", icon: "/images/facebook.svg" },
  { name: "LinkedIn", href: "#", icon: "/images/linkedin.svg" },
];

const Footer = () => {
  return (
    <footer className="footer-section-container-main">
      <div className="footer-section-container container" data-node-id="558:1264">
        <div className="footer-left-section">
          <img className="footer-logo" src="/images/marca-ubi.png" alt="Marca Ubi" data-node-id="558:1267" />

          <address className="footer-address" data-node-id="558:1268">
            Hilite Business Park
            <br />
            State Highway 28, Palazhi, Kozhikode, Pantheeramkavu,
            <br />
            Kerala 673014
          </address>
        </div>

        <div className="footer-middle-section">
          <h5 data-node-id="558:1270">Quick Links</h5>
          <nav className="footer-links-list" aria-label="Footer quick links" data-node-id="558:1271">
            {quickLinks.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="footer-right-section">
          <div className="footer-social-row">
            {socialLinks.map((item) => (
              <a
                key={item.name}
                className="footer-social-link"
                href={item.href}
                aria-label={item.name}
              >
                <img src={item.icon} alt="" aria-hidden="true" />
              </a>
            ))}
          </div>

          <a className="footer-contact-btn" href="#" data-node-id="558:1283">
            <span className="footer-contact-label">Contact us</span>
            <span className="footer-contact-icon-wrap" aria-hidden="true">
              <img src="/images/top-right-arrow.png" alt="" />
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
