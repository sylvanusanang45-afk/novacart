import { useState } from "react";
import { Heart, Menu, ShoppingBag, X } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useStore } from "../StoreContext";
import { useAuth } from "../AuthContext";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const { cartCount, wishlist } = useStore();
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleSignOut() {
    setAuthError("");
    setSigningOut(true);
    try {
      await signOut();
      closeMenu();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("NovaCart could not sign out.", error);
      setAuthError("Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="navbar">
      <div className="announcement-bar">Thoughtful finds for everyday living.</div>
      <div className="navbar-inner">
        <Link to="/" className="brand-logo" onClick={closeMenu}>
          nova<span>cart.</span>
        </Link>

        <button
          className="mobile-menu-button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          type="button"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav id="primary-navigation" className={menuOpen ? "nav-links open" : "nav-links"}>
          <NavLink to="/" onClick={closeMenu}>Home</NavLink>
          <NavLink to="/shop" onClick={closeMenu}>Shop</NavLink>
          <NavLink to="/wishlist" onClick={closeMenu}>Wishlist</NavLink>
          {role === "admin" && <NavLink to="/admin" onClick={closeMenu}>Admin</NavLink>}
          {!user && <NavLink to="/login" onClick={closeMenu}>Sign in</NavLink>}
        </nav>

        <div className="nav-actions">
          <Link to="/wishlist" className="nav-icon" aria-label="Wishlist">
            <Heart size={21} />
            {wishlist.length > 0 && <span className="nav-count">{wishlist.length}</span>}
          </Link>
          <Link to="/cart" className="nav-icon" aria-label="Shopping cart">
            <ShoppingBag size={21} />
            {cartCount > 0 && <span className="nav-count">{cartCount}</span>}
          </Link>
          {user ? (
            <button className="nav-auth-button" type="button" onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          ) : (
            <Link className="nav-auth-link" to="/signup" onClick={closeMenu}>Join</Link>
          )}
        </div>
      </div>
      {authError && <p className="nav-auth-error" role="alert">{authError}</p>}
    </header>
  );
}

export default Navbar;
