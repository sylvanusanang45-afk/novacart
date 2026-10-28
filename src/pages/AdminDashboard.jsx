import { Package, ShoppingBag, Users } from "lucide-react";

import { products } from "../data/products";

function AdminDashboard() {
  return (
    <main className="page-container admin-page">
      <div className="page-heading">
        <p className="eyebrow">STORE MANAGEMENT</p>

        <h1>
          Your <em>dashboard.</em>
        </h1>

        <p>
          A starting point for managing the NovaCart store.
        </p>
      </div>

      <div className="admin-stats">
        <article className="admin-stat">
          <Package size={25} />

          <p>Products</p>

          <h2>{products.length}</h2>
        </article>

        <article className="admin-stat">
          <ShoppingBag size={25} />

          <p>Orders</p>

          <h2>0</h2>
        </article>

        <article className="admin-stat">
          <Users size={25} />

          <p>Customers</p>

          <h2>0</h2>
        </article>
      </div>

      <section className="admin-products">
        <h2>Product catalogue</h2>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${product.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="admin-notice">
        This is a demo dashboard. Product editing, order management,
        and admin permissions will be implemented with the backend.
      </p>
    </main>
  );
}

export default AdminDashboard;