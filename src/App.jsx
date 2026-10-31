
import { Navigate, Routes, Route } from "react-router-dom";
import { StoreProvider } from "./StoreContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import NovaAssistant from "./components/ai/NovaAssistant";
import RequireAuth from "./components/RequireAuth";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import PaymentCallback from "./pages/PaymentCallback";

function App() {
  return (
    <StoreProvider>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/cart" element={<Cart />} />

        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <Checkout />
            </RequireAuth>
          }
        />

        <Route
          path="/payment/callback"
          element={
            <RequireAuth>
              <PaymentCallback />
            </RequireAuth>
          }
        />

        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/admin"
          element={
            <RequireAuth adminOnly>
              <AdminDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="*"
          element={
            <main className="empty-state">
              <h1>Oops! Page not found.</h1>
              <p>Looks like this page took a little detour.</p>
            </main>
          }
        />
      </Routes>

      <Footer />

      <NovaAssistant />
    </StoreProvider>
  );
}

export default App;
