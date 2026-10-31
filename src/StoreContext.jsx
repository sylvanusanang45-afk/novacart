
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

import { useProducts } from "./hooks/useProducts";

const StoreContext = createContext();

function readStoredValue(key, fallback) {
  try {
    const savedValue = window.localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : fallback;
  } catch (error) {
    console.warn(`NovaCart could not read ${key} from browser storage.`, error);
    return fallback;
  }
}

function writeStoredValue(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`NovaCart could not save ${key} to browser storage.`, error);
  }
}

export function StoreProvider({ children }) {
  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useProducts();

  const [savedCart, setSavedCart] = useState(() => {
    const value = readStoredValue("novacart-cart", []);
    return Array.isArray(value) ? value : [];
  });

  const [wishlist, setWishlist] = useState(() => {
    const value = readStoredValue("novacart-wishlist", []);
    return Array.isArray(value) ? value : [];
  });

  const cart = useMemo(() => {
    if (productsLoading || productsError) return [];

    return savedCart.flatMap((savedItem) => {
      const product = products.find(
        (item) => String(item.id) === String(savedItem?.id)
      );

      const quantity = Number(savedItem?.quantity);

      if (!product || !Number.isInteger(quantity) || quantity < 1) {
        return [];
      }

      return [{ ...product, quantity }];
    });
  }, [savedCart, products, productsLoading, productsError]);

  const wishlistProducts = useMemo(() => {
    if (productsLoading || productsError) return [];

    return products.filter((product) =>
      wishlist.some((id) => String(id) === String(product.id))
    );
  }, [products, wishlist, productsLoading, productsError]);

  useEffect(() => {
    if (!productsLoading && !productsError) {
      writeStoredValue("novacart-cart", cart);
    }
  }, [cart, productsLoading, productsError]);

  useEffect(() => {
    writeStoredValue("novacart-wishlist", wishlist);
  }, [wishlist]);

  function addToCart(product) {
    setSavedCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => String(item.id) === String(product.id)
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          String(item.id) === String(product.id)
            ? {
                ...item,
                quantity: Number(item.quantity) + 1,
              }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  }

  function changeQuantity(id, amount) {
    setSavedCart((currentCart) =>
      currentCart
        .map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                quantity: Number(item.quantity) + amount,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setSavedCart((currentCart) =>
      currentCart.filter((item) => String(item.id) !== String(id))
    );
  }

  const clearCart = useCallback(() => {
    setSavedCart([]);
  }, []);

  function toggleWishlist(id) {
    setWishlist((currentWishlist) =>
      currentWishlist.some((itemId) => String(itemId) === String(id))
        ? currentWishlist.filter(
            (itemId) => String(itemId) !== String(id)
          )
        : [...currentWishlist, id]
    );
  }

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );

  return (
    <StoreContext.Provider
      value={{
        products,
        productsLoading,
        productsError,
        cart,
        wishlist,
        wishlistProducts,
        cartCount,
        cartTotal,
        addToCart,
        changeQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
