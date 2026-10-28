import { Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../StoreContext";

function ProductCard({ product }) {
  const {
    wishlist,
    toggleWishlist,
    addToCart,
  } = useStore();

  const isFavourite = wishlist.includes(product.id);

  return (
    <article className="product-card">
      <div className="product-image-wrapper">
        <Link to={`/products/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="product-image"
            loading="lazy"
            decoding="async"
          />
        </Link>

        {product.badge && (
          <span className="product-badge">
            {product.badge}
          </span>
        )}

        <button
          className={`wishlist-button ${
            isFavourite ? "active" : ""
          }`}
          onClick={() => toggleWishlist(product.id)}
          aria-label={
            isFavourite
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={isFavourite}
        >
          <Heart
            size={19}
            fill={isFavourite ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div className="product-information">
        <p className="product-category">
          {product.category}
        </p>

        <Link
          to={`/products/${product.id}`}
          className="product-name"
        >
          {product.name}
        </Link>

        <p className="product-description">
          {product.description}
        </p>

        <div className="product-bottom">
          <div className="product-prices">
            <span className="product-price">
              ${product.price.toFixed(2)}
            </span>

            {product.oldPrice && (
              <span className="old-price">
                ${product.oldPrice.toFixed(2)}
              </span>
            )}
          </div>

          <button
            className="add-to-cart-button"
            onClick={() => addToCart(product)}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;