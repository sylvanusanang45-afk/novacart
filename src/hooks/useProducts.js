
import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const { data, error: fetchError } = await supabase
          .from("products")
          .select("*")
          .order("id", { ascending: true });

        if (fetchError) throw fetchError;

        if (active) {
          setProducts(
            (data || []).map((product) => ({
              ...product,
              oldPrice: product.old_price,
              image: product.image,
            }))
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load products."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      active = false;
    };
  }, []);

  return { products, loading, error };
}
