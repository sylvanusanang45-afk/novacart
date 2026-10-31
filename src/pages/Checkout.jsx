
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  LoaderCircle,
} from "lucide-react";

import { supabase } from "../supabase";
import { useAuth } from "../AuthContext";
import { useStore } from "../StoreContext";

function Checkout() {
  const { user } = useAuth();

  const {
    cart,
    cartTotal,
    productsLoading,
    productsError,
  } = useStore();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    phone: "",
    country: "",
    city: "",
    deliveryAddress: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    if (cart.length === 0 && !productsLoading && !createdOrder) {
      navigate("/cart", { replace: true });
    }
  }, [cart.length, productsLoading, navigate, createdOrder]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function initializePayment(reference) {
    setLoading(true);
    setError("");

    try {
      const { data, error: paymentError } =
        await supabase.functions.invoke("initialize-payment", {
          body: { reference },
        });

      if (paymentError) {
        let message = paymentError.message;

        try {
          const details = await paymentError.context?.json();

          if (details?.error) {
            message = details.error;
          }
        } catch {
          // Keep the original error message.
        }

        throw new Error(message || "Unable to initialize payment.");
      }

      if (!data?.authorization_url) {
        throw new Error("Paystack did not return a payment URL.");
      }

      window.location.assign(data.authorization_url);
    } catch (err) {
      console.error("NovaCart payment initialization error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to start payment. Please try again."
      );

      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (productsError) {
      setError("We couldn't load your cart. Please try again.");
      return;
    }

    if (!user) {
      setError("Please sign in before placing an order.");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const requiredFields = Object.values(form);

    if (requiredFields.some((value) => !value.trim())) {
      setError("Please complete all delivery details.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: orderError } =
        await supabase.functions.invoke("create-order", {
          body: {
            ...form,
            items: cart.map((item) => ({
              product_id: item.id,
              quantity: item.quantity,
            })),
          },
        });

      if (orderError) {
        let message = orderError.message;

        try {
          const details = await orderError.context?.json();

          if (details?.error) {
            message = details.error;
          }
        } catch {
          // Keep the original error message.
        }

        throw new Error(message || "Unable to create your order.");
      }

      if (!data?.order?.reference) {
        throw new Error(
          "The order was created, but no reference was returned."
        );
      }

      setCreatedOrder(data.order);

      // Start payment using the order that was just created.
      await initializePayment(data.order.reference);
    } catch (err) {
      console.error("NovaCart checkout error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  }

  if (productsLoading || (cart.length === 0 && !createdOrder)) {
    return (
      <main className="page-container">
        <div className="empty-state">
          <p>Preparing your checkout...</p>
        </div>
      </main>
    );
  }

  if (createdOrder) {
    return (
      <main className="page-container checkout-page">
        <div className="empty-state">
          <CheckCircle2 size={54} />

          <p className="eyebrow">ORDER CREATED</p>

          <h1>
            You're almost <em>there.</em>
          </h1>

          <p>
            Your order has been saved. Complete your payment
            to confirm your purchase.
          </p>

          <div className="order-confirmation">
            <p>Order reference</p>
            <strong>{createdOrder.reference}</strong>

            <p>Order total</p>
            <strong>
              ${Number(createdOrder.total).toFixed(2)} USD
            </strong>
          </div>

          {error && (
            <p className="auth-feedback auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            className="primary-button checkout-button"
            onClick={() => initializePayment(createdOrder.reference)}
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle size={17} />
                Preparing payment...
              </>
            ) : (
              "Pay securely with Paystack"
            )}
          </button>

          <p className="checkout-note">
            You'll be redirected to Paystack to complete payment in GHS.
          </p>

          <Link to="/shop" className="back-link">
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container checkout-page">
      <div className="page-heading">
        <p className="eyebrow">ALMOST YOURS</p>

        <h1>
          Secure <em>checkout.</em>
        </h1>

        <p>Enter your delivery details to continue.</p>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <section className="checkout-section">
            <h2>Contact information</h2>

            <label htmlFor="checkout-name">Full name</label>
            <input
              id="checkout-name"
              name="fullName"
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={handleChange}
              required
            />

            <label htmlFor="checkout-email">Email address</label>
            <input
              id="checkout-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="checkout-phone">Phone number</label>
            <input
              id="checkout-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+233..."
              value={form.phone}
              onChange={handleChange}
              required
            />
          </section>

          <section className="checkout-section">
            <h2>Delivery address</h2>

            <label htmlFor="checkout-country">Country</label>
            <input
              id="checkout-country"
              name="country"
              type="text"
              autoComplete="country-name"
              placeholder="Country"
              value={form.country}
              onChange={handleChange}
              required
            />

            <label htmlFor="checkout-city">City</label>
            <input
              id="checkout-city"
              name="city"
              type="text"
              autoComplete="address-level2"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              required
            />

            <label htmlFor="checkout-address">
              Full delivery address
            </label>

            <textarea
              id="checkout-address"
              name="deliveryAddress"
              autoComplete="street-address"
              placeholder="House number, street, area and directions"
              rows={4}
              value={form.deliveryAddress}
              onChange={handleChange}
              required
            />
          </section>

          {error && (
            <p className="auth-feedback auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="primary-button checkout-button"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle size={17} />
                Preparing payment...
              </>
            ) : (
              "Continue to payment"
            )}
          </button>

          <p className="checkout-note">
            <LockKeyhole size={14} />
            Your information is used to process your order.
          </p>
        </form>

        <aside className="cart-summary checkout-summary">
          <h2>Your order</h2>

          <div className="checkout-products">
            {cart.map((item) => (
              <div className="checkout-product" key={item.id}>
                <img src={item.image} alt={item.name} />

                <div>
                  <h3>{item.name}</h3>
                  <p>Quantity: {item.quantity}</p>
                </div>

                <strong>
                  ${(Number(item.price) * item.quantity).toFixed(2)}
                </strong>
              </div>
            ))}
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>Calculated later</span>
          </div>

          <div className="summary-total">
            <span>Total before shipping</span>
            <strong>${cartTotal.toFixed(2)}</strong>
          </div>

          <Link to="/cart" className="back-link">
            <ArrowLeft size={16} />
            Back to cart
          </Link>
        </aside>
      </div>
    </main>
  );
}

export default Checkout;
