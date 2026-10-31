
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, RefreshCw } from "lucide-react";
import { supabase } from "../supabase";
import { useAuth } from "../AuthContext";

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(amount) || 0);
}

function formatLabel(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function Orders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("orders")
        .select(`
          id,
          paystack_reference,
          created_at,
          subtotal,
          shipping,
          total,
          currency,
          status,
          payment_status,
          order_items (
            id,
            product_name,
            product_image,
            unit_price,
            quantity,
            line_total
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (queryError) {
        console.error("Could not load orders:", queryError);
        setError("We couldn't load your orders. Please try again.");
        setOrders([]);
      } else {
        setOrders(data || []);
      }

      setLoading(false);
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, [user?.id]);

  async function refreshOrders() {
    if (!user?.id) return;

    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("orders")
      .select(`
        id,
        paystack_reference,
        created_at,
        subtotal,
        shipping,
        total,
        currency,
        status,
        payment_status,
        order_items (
          id,
          product_name,
          product_image,
          unit_price,
          quantity,
          line_total
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) {
      console.error("Could not refresh orders:", queryError);
      setError("We couldn't refresh your orders. Please try again.");
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  }

  return (
    <main className="page-container orders-page">
      <div className="orders-header">
        <div>
          <p className="section-eyebrow">YOUR ACCOUNT</p>
          <h1>My Orders</h1>
          <p>Track your purchases and review your order details.</p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={refreshOrders}
          disabled={loading}
        >
          <RefreshCw size={16} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="orders-message">
          <div className="payment-spinner" />
          <p>Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="orders-message" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="primary-button"
            onClick={refreshOrders}
          >
            Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state orders-empty">
          <Package size={42} />
          <h2>No orders yet</h2>
          <p>Your purchases will appear here when you place an order.</p>
          <Link to="/shop" className="primary-button">
            Explore the shop
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-card-header">
                <div>
                  <p className="order-label">ORDER REFERENCE</p>
                  <strong className="order-reference">
                    {order.paystack_reference}
                  </strong>
                  <p className="order-date">
                    Placed {formatDate(order.created_at)}
                  </p>
                </div>

                <div className="order-statuses">
                  <span
                    className={`order-status payment-${order.payment_status}`}
                  >
                    Payment: {formatLabel(order.payment_status)}
                  </span>
                  <span
                    className={`order-status fulfillment-${order.status}`}
                  >
                    {formatLabel(order.status)}
                  </span>
                </div>
              </div>

              <div className="order-items">
                {(order.order_items || []).map((item) => (
                  <div className="order-item" key={item.id}>
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="order-item-image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="order-item-placeholder">
                        <Package size={22} />
                      </div>
                    )}

                    <div className="order-item-details">
                      <h3>{item.product_name}</h3>
                      <p>Quantity: {item.quantity}</p>
                      <p>
                        {formatMoney(item.unit_price, order.currency)} each
                      </p>
                    </div>

                    <strong className="order-item-total">
                      {formatMoney(item.line_total, order.currency)}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="order-card-footer">
                <div className="order-total-breakdown">
                  <p>
                    Subtotal:{" "}
                    {formatMoney(order.subtotal, order.currency)}
                  </p>
                  <p>
                    Shipping:{" "}
                    {formatMoney(order.shipping, order.currency)}
                  </p>
                </div>

                <div className="order-total">
                  <span>Order total</span>
                  <strong>
                    {formatMoney(order.total, order.currency)}
                  </strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default Orders;
