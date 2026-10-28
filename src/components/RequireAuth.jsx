import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

function RequireAuth({ children, adminOnly = false }) {
  const { user, loading, role, roleLoading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="empty-state" aria-live="polite">
        <p>Checking your session...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (adminOnly && roleLoading) {
    return (
      <main className="empty-state" aria-live="polite">
        <p>Checking your access...</p>
      </main>
    );
  }

  if (adminOnly && role !== "admin") {
    return (
      <main className="empty-state">
        <h1>Admin access required.</h1>
        <p>This account does not have permission to open the store dashboard.</p>
        <Link className="primary-button" to="/">Return to NovaCart</Link>
      </main>
    );
  }

  return children;
}

export default RequireAuth;
