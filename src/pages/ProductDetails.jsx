import { useParams, Link } from "react-router-dom";

import { ArrowLeft, Heart, ShoppingBag } from "lucide-react";

import { products } from "../data/products";
import { useStore } from "../StoreContext";

function ProductDetails() {
  const { id } = useParams();

  const product = products.find(
    (item) => item.id === Number(id)
  );

  const {
    addToCart,
    wishlist,
    toggleWishlist,
  } = useStore();

  if (!product) {
    return (
      <main className="empty-state">
        <h1>We couldn't find that product.</h1>

        <Link to="/shop" className="primary-button">
          Back to the shop
        </Link>
      </main>
    );
  }

  const isFavourite = wishlist.includes(product.id);

  return (
    <main className="page-container details-page">
      <Link to="/shop" className="back-link">
        <ArrowLeft size={17} />
        Back to the collection
      </Link>

      <div className="details-layout">
        <div className="details-image">
          <img
            src={product.image}
            alt={product.name}
          />
        </div>

        <div className="details-information">
          <p className="eyebrow">
            {product.category}
          </p>

          <h1>{product.name}</h1>

          <div className="details-price">
            ${product.price.toFixed(2)}

            {product.oldPrice && (
              <span className="old-price">
                ${product.oldPrice.toFixed(2)}
              </span>
            )}
          </div>

          <p className="details-description">
            {product.description}
          </p>

          <div className="details-actions">
            <button
              className="primary-button"
              onClick={() => addToCart(product)}
            >
              <ShoppingBag size={19} />
              Add to cart
            </button>

            <button
              className="secondary-button"
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart
                size={19}
                fill={isFavourite ? "currentColor" : "none"}
              />

              {isFavourite
                ? "Saved to wishlist"
                : "Add to wishlist"}
            </button>
          </div>

          <div className="details-note">
            <p>✳ Thoughtfully chosen for everyday living.</p>
            <p>✳ Simple, considered shopping.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ProductDetails;