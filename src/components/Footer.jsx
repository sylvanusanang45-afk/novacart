import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div>
          <Link to="/" className="brand-logo footer-logo">
            nova<span>cart.</span>
          </Link>

          <p>
            Good things for everyday life.
            Thoughtfully chosen, made to be loved.
          </p>
        </div>

        <div className="footer-links">
          <h3>Explore</h3>

          <Link to="/">Home</Link>
          <Link to="/shop">Shop everything</Link>
          <Link to="/wishlist">Your wishlist</Link>
          <Link to="/cart">Your cart</Link>
        </div>

        <div className="footer-links">
          <h3>Our promise</h3>

          <p>Thoughtful products.</p>
          <p>Simple shopping.</p>
          <p>Everyday joy.</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 NovaCart. Made with care.</p>

        <p>A little something for your everyday.</p>
      </div>
    </footer>
  );
}

export default Footer;