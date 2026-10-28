import {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";

import { products } from "./data/products";

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
  const [cart, setCart] = useState(() => {
    const savedCart = readStoredValue("novacart-cart", []);

    if (!Array.isArray(savedCart)) return [];

    // Use the catalogue's current price and details instead of trusting
    // stale or manually edited product data from localStorage.
    return savedCart.flatMap((savedItem) => {
      const product = products.find((item) => item.id === savedItem?.id);
      const quantity = Number(savedItem?.quantity);

      if (!product || !Number.isInteger(quantity) || quantity < 1) {
        return [];
      }

      return [{ ...product, quantity }];
    });
  });

  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = readStoredValue("novacart-wishlist", []);

    if (!Array.isArray(savedWishlist)) return [];

    return [...new Set(savedWishlist)].filter((id) =>
      products.some((product) => product.id === id)
    );
  });

  useEffect(() => {
    writeStoredValue("novacart-cart", cart);
  }, [cart]);

  useEffect(() => {
    writeStoredValue("novacart-wishlist", wishlist);
  }, [wishlist]);

  function addToCart(product) {
    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentCart,
        { ...product, quantity: 1 },
      ];
    });
  }

  function changeQuantity(id, amount) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity + amount,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id)
    );
  }

  function toggleWishlist(id) {
    setWishlist((currentWishlist) =>
      currentWishlist.includes(id)
        ? currentWishlist.filter((itemId) => itemId !== id)
        : [...currentWishlist, id]
    );
  }

  const wishlistProducts = products.filter((product) =>
    wishlist.includes(product.id)
  );

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <StoreContext.Provider
      value={{
        cart,
        wishlist,
        wishlistProducts,
        cartCount,
        cartTotal,
        addToCart,
        changeQuantity,
        removeFromCart,
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