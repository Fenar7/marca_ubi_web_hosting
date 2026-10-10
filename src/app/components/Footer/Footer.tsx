import Link from "next/link";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Works", href: "/#works" },
  { label: "Contact", href: "/#contact" },
  { label: "Testimonial", href: "/#testimonials" },
];

const socialLinks = [
  { name: "Instagram", href: "https://www.instagram.com/marcaubi", icon: "/images/instagram.svg" },
  { name: "Facebook", href: "https://www.facebook.com/marcaubi", icon: "/images/facebook.svg" },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/marcaubi", icon: "/images/linkedin.svg" },
];

const Footer = () => {
  return (
    <footer className="footer-section-container-main">
      <div className="footer-section-container container" data-node-id="558:1264">
        <div className="footer-left-section">
          <Link className="footer-logo-link" href="/" aria-label="Marca Ubi homepage">
            <img className="footer-logo" src="/images/marca-ubi.png" alt="Marca Ubi" data-node-id="558:1267" />
          </Link>

          <address className="footer-address" data-node-id="558:1268">
            Hilite Business Park
            <br />
            Hilite City
            <br />
            Calicut, Kerala 673014
          </address>
        </div>

        <div className="footer-middle-section">
          <p className="footer-links-title" data-node-id="558:1270">Quick Links</p>
          <nav className="footer-links-list" aria-label="Footer quick links" data-node-id="558:1271">
            {quickLinks.map((link) => (
              <Link key={link.label} href={link.href}>
                {link.label}
              </Link>
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
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={item.icon} alt="" aria-hidden="true" />
              </a>
            ))}
          </div>

          <Link
            className="footer-contact-btn"
            href="/start-project"
            aria-label="Start a project — contact Marca Ubi"
            data-node-id="558:1283"
          >
            <span className="footer-contact-label">Contact us</span>
            <span className="footer-contact-icon-wrap" aria-hidden="true">
              <img src="/images/top-right-arrow.png" alt="" width={16} height={16} />
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
