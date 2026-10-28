import { products } from "../data/products";

// NovaCart currently ships with a local catalogue. This hook keeps the
// product-loading interface simple while a real backend is not configured.
export function useProducts() {
  return {
    products,
    loading: false,
    error: "",
  };
}
