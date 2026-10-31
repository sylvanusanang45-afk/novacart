
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { useStore } from "../StoreContext";

function Cart() {
  const {
    cart,
    cartCount,
    cartTotal,
    changeQuantity,
    removeFromCart,
  } = useStore();

  const navigate = useNavigate();

  const handleCheckout = () => {
    if (cart.length === 0) return;
    navigate("/checkout");
  };

  return (
    <main className="page-container cart-page">
      <div className="page-heading">
        <p className="eyebrow">YOUR GOOD FINDS</p>

        <h1>
          Your <em>cart.</em>
        </h1>
      </div>

      {cart.length === 0 ? (
        <div className="empty-state">
          <h2>Your cart is having a quiet moment.</h2>

          <p>
            Find something you love and bring it home.
          </p>

          <Link to="/shop" className="primary-button">
            Explore the shop
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item) => (
              <article className="cart-item" key={item.id}>
                <img
                  src={item.image}
                  alt={item.name}
                />

                <div className="cart-item-information">
                  <h3>{item.name}</h3>

                  <p>${Number(item.price).toFixed(2)} each</p>

                  <div className="quantity-controls">
                    <button
                      onClick={() => changeQuantity(item.id, -1)}
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      <Minus size={15} />
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() => changeQuantity(item.id, 1)}
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>

                <div className="cart-item-end">
                  <strong>
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </strong>

                  <button
                    className="remove-button"
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ))}

            <Link to="/shop" className="back-link">
              <ArrowLeft size={17} />
              Continue shopping
            </Link>
          </div>

          <aside className="cart-summary">
            <h2>Order summary</h2>

            <div className="summary-row">
              <span>Items</span>
              <span>{cartCount}</span>
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

            <button
              className="primary-button checkout-button"
              onClick={handleCheckout}
            >
              Continue to checkout
            </button>

            <p className="checkout-note">
              A little something good is almost yours.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}

export default Cart;
