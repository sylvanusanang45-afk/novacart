import { Link } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import { useStore } from "../StoreContext";

function Wishlist() {
  const { wishlistProducts } = useStore();

  return (
    <main className="page-container">
      <div className="page-heading">
        <p className="eyebrow">SAVED WITH LOVE</p>

        <h1>
          Your little <em>wishlist.</em>
        </h1>

        <p>
          All the things that caught your eye.
        </p>
      </div>

      {wishlistProducts.length > 0 ? (
        <div className="product-grid">
          {wishlistProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Nothing saved just yet.</h2>

          <p>
            When something catches your eye,
            save it here for later.
          </p>

          <Link to="/shop" className="primary-button">
            Explore the collection
          </Link>
        </div>
      )}
    </main>
  );
}

export default Wishlist;