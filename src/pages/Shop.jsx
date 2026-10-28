import { useState } from "react";

import { Search } from "lucide-react";

import { categories } from "../data/products";
import { useProducts } from "../hooks/useProducts";
import ProductCard from "../components/ProductCard";

function Shop() {
  const { products } = useProducts();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Everything");
  const [sortBy, setSortBy] = useState("featured");

  const normalizedSearch = search.trim().toLowerCase();
  const filteredProducts = products
    .filter((product) => {
      const searchableText = [
        product.name,
        product.description,
        product.category,
      ].filter(Boolean).join(" ").toLowerCase();

      const matchesSearch = searchableText.includes(normalizedSearch);
      const matchesCategory =
        category === "Everything" || product.category === category;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name);
        case "featured":
        default:
          return products.indexOf(a) - products.indexOf(b);
      }
    });

  return (
    <main className="page-container shop-page">
      <div className="page-heading">
        <p className="eyebrow">YOUR NEXT FAVOURITE THING</p>

        <h1>
          Shop the <em>collection.</em>
        </h1>

        <p>
          A thoughtful mix of things for your home,
          your routine, and your everyday adventures.
        </p>
      </div>

      <div className="shop-toolbar">
        <div className="search-box">
          <Search size={19} />

          <input
            type="search"
            aria-label="Search products"
            placeholder="Find something lovely..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="category-filters" aria-label="Filter by category">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={
                category === item
                  ? "category-button active"
                  : "category-button"
              }
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
            >
              {item}
            </button>
          ))}
        </div>

        <label className="sort-control">
          <span>Sort by</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            aria-label="Sort products"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </label>
      </div>

      <p className="results-count" aria-live="polite">
        Showing {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
      </p>

      {filteredProducts.length > 0 ? (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Nothing here just yet.</h2>

          <p>
            Try another search or choose a different category.
          </p>

          <button
            className="primary-button"
            onClick={() => {
              setSearch("");
              setCategory("Everything");
              setSortBy("featured");
            }}
          >
            Show all products
          </button>
        </div>
      )}
    </main>
  );
}

export default Shop;