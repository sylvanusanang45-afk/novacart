
import { useEffect, useState } from "react";
import {
  Package,
  ShoppingBag,
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../supabase";
import { useProducts } from "../hooks/useProducts";

const emptyForm = {
  name: "",
  category: "",
  price: "",
  oldPrice: "",
  image: "",
  badge: "",
  description: "",
};

const PAGE_SIZE = 1000;

function AdminDashboard() {
  const { products, loading, error } = useProducts();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [ordersCount, setOrdersCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchAdminStats() {
      setStatsLoading(true);
      setStatsError("");

      try {
        const { count, error: countError } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true });

        if (countError) throw countError;

        const customerIds = new Set();
        let offset = 0;

        while (true) {
          const { data, error: customersError } = await supabase
            .from("orders")
            .select("user_id")
            .range(offset, offset + PAGE_SIZE - 1);

          if (customersError) throw customersError;

          for (const order of data ?? []) {
            if (order.user_id) {
              customerIds.add(String(order.user_id));
            }
          }

          if (!data || data.length < PAGE_SIZE) break;

          offset += PAGE_SIZE;
        }

        if (!cancelled) {
          setOrdersCount(count ?? 0);
          setCustomersCount(customerIds.size);
        }
      } catch (err) {
        console.error("Could not load NovaCart admin statistics:", err);

        if (!cancelled) {
          setStatsError(
            "Couldn't load order statistics. Check that your admin account can read the orders table."
          );
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    }

    fetchAdminStats();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function openAddForm() {
    setForm(emptyForm);
    setEditingId(null);
    setActionError("");
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(product) {
    setForm({
      name: product.name ?? "",
      category: product.category ?? "",
      price: String(product.price ?? ""),
      oldPrice:
        product.oldPrice != null
          ? String(product.oldPrice)
          : product.old_price != null
            ? String(product.old_price)
            : "",
      image: product.image ?? "",
      badge: product.badge ?? "",
      description: product.description ?? "",
    });

    setEditingId(product.id);
    setActionError("");
    setNotice("");
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setActionError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setActionError("");
    setNotice("");

    const price = Number(form.price);
    const oldPrice =
      form.oldPrice.trim() === ""
        ? null
        : Number(form.oldPrice);

    if (!Number.isFinite(price) || price < 0) {
      setActionError("Enter a valid product price.");
      setSaving(false);
      return;
    }

    if (
      oldPrice !== null &&
      (!Number.isFinite(oldPrice) || oldPrice < 0)
    ) {
      setActionError("Enter a valid original price or leave it blank.");
      setSaving(false);
      return;
    }

    const productData = {
      name: form.name.trim(),
      category: form.category.trim(),
      price,
      old_price: oldPrice,
      image: form.image.trim(),
      badge: form.badge.trim() || null,
      description: form.description.trim(),
    };

    if (
      !productData.name ||
      !productData.category ||
      !productData.image ||
      !productData.description
    ) {
      setActionError("Please complete all required fields.");
      setSaving(false);
      return;
    }

    try {
      let result;

      if (editingId !== null) {
        result = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingId)
          .select()
          .single();
      } else {
        result = await supabase
          .from("products")
          .insert([productData])
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      setNotice(
        editingId !== null
          ? "Product updated successfully."
          : "Product added successfully."
      );

      closeForm();

      window.location.reload();
    } catch (err) {
      console.error("NovaCart could not save the product:", err);
      setActionError(
        err.message ||
          "Couldn't save the product. Check your admin permissions and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(product.id);
    setActionError("");
    setNotice("");

    try {
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (deleteError) {
        throw deleteError;
      }

      window.alert(`"${product.name}" was deleted successfully.`);
      window.location.reload();
    } catch (err) {
      console.error("NovaCart could not delete the product:", err);
      setActionError(
        err.message ||
          "Couldn't delete the product. Check your admin permissions and try again."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="page-container admin-page">
      <div className="page-heading">
        <p className="eyebrow">STORE MANAGEMENT</p>

        <h1>
          Your <em>dashboard.</em>
        </h1>

        <p>Manage your NovaCart product catalogue.</p>
      </div>

      <div className="admin-stats">
        <article className="admin-stat">
          <Package size={25} />
          <p>Products</p>
          <h2>{loading ? "..." : products.length}</h2>
        </article>

        <article className="admin-stat">
          <ShoppingBag size={25} />
          <p>Orders</p>
          <h2>{statsLoading ? "..." : ordersCount}</h2>
        </article>

        <article className="admin-stat">
          <Users size={25} />
          <p>Customers</p>
          <h2>{statsLoading ? "..." : customersCount}</h2>
        </article>
      </div>

      {statsError && (
        <p className="admin-notice" role="alert">
          {statsError}
        </p>
      )}

      <section className="admin-products">
        <div className="admin-products-heading">
          <h2>Product catalogue</h2>

          <button
            type="button"
            className="primary-button"
            onClick={openAddForm}
          >
            <Plus size={17} />
            Add product
          </button>
        </div>

        {notice && (
          <p role="status" className="admin-success">
            {notice}
          </p>
        )}

        {actionError && (
          <div className="empty-state" role="alert">
            <p>{actionError}</p>
          </div>
        )}

        {showForm && (
          <form className="admin-product-form" onSubmit={handleSubmit}>
            <div className="admin-form-heading">
              <h3>
                {editingId !== null ? "Edit product" : "Add a new product"}
              </h3>

              <button
                type="button"
                className="admin-close-button"
                onClick={closeForm}
                aria-label="Close product form"
              >
                <X size={20} />
              </button>
            </div>

            <label>
              Product name *
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Everyday Ceramic Mug"
                required
                maxLength={150}
              />
            </label>

            <label>
              Category *
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Home"
                required
                maxLength={80}
              />
            </label>

            <div className="admin-form-row">
              <label>
                Price ($) *
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="24.00"
                  required
                />
              </label>

              <label>
                Original price ($)
                <input
                  name="oldPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.oldPrice}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </label>
            </div>

            <label>
              Product image URL *
              <input
                name="image"
                type="url"
                value={form.image}
                onChange={handleChange}
                placeholder="https://example.com/product.jpg"
                required
              />
            </label>

            <label>
              Badge
              <input
                name="badge"
                value={form.badge}
                onChange={handleChange}
                placeholder="e.g. Bestseller (optional)"
                maxLength={50}
              />
            </label>

            <label>
              Description *
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the product..."
                rows={4}
                required
                maxLength={2000}
              />
            </label>

            <div className="admin-form-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save changes"
                    : "Add product"}
              </button>

              <button
                type="button"
                className="admin-cancel-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p>Loading products...</p>
        ) : error ? (
          <div className="empty-state">
            <p>We couldn't load the products.</p>
            <p>{error}</p>
          </div>
        ) : products.length === 0 ? (
          <p>No products have been added yet.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-product-name">
                        <img
                          src={product.image}
                          alt=""
                          loading="lazy"
                        />
                        <span>{product.name}</span>
                      </div>
                    </td>

                    <td>{product.category}</td>

                    <td>${Number(product.price).toFixed(2)}</td>

                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="admin-edit-button"
                          onClick={() => openEditForm(product)}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          type="button"
                          className="admin-delete-button"
                          onClick={() => handleDelete(product)}
                          disabled={deletingId === product.id}
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 size={16} />
                          {deletingId === product.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="admin-notice">
        Product changes are saved to Supabase. Orders and customer counts are
        calculated from the orders table.
      </p>
    </main>
  );
}

export default AdminDashboard;
