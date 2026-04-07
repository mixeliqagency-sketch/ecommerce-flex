"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import type { Product, CartItem } from "@/types";
import { trackAddToCart, trackRemoveFromCart } from "@/lib/analytics";

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, cantidad?: number, variante?: string) => void;
  removeItem: (productId: string, variante?: string) => void;
  updateQuantity: (
    productId: string,
    cantidad: number,
    variante?: string
  ) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  // Toast de "producto agregado"
  toastProduct: Product | null;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [toastProduct, setToastProduct] = useState<Product | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpiar timer del toast al desmontar el componente
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // Cargar carrito de localStorage al iniciar
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        // Si el JSON esta corrupto, ignorar
      }
    }
    setLoaded(true);
  }, []);

  // Guardar carrito en localStorage al cambiar
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items, loaded]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(
    (product: Product, cantidad = 1, variante?: string) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.product.id === product.id && i.variante === variante
        );
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id && i.variante === variante
              ? { ...i, cantidad: i.cantidad + cantidad }
              : i
          );
        }
        return [...prev, { product, cantidad, variante }];
      });
      // Mostrar toast en vez de abrir el drawer
      setToastProduct(product);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToastProduct(null), 3000);
      // Analytics: registrar producto agregado al carrito
      trackAddToCart(product.slug, product.nombre, product.precio);
    },
    []
  );

  const removeItem = useCallback(
    (productId: string, variante?: string) => {
      setItems((prev) =>
        prev.filter(
          (i) => !(i.product.id === productId && i.variante === variante)
        )
      );
      // Analytics: registrar producto removido del carrito
      trackRemoveFromCart(productId);
    },
    []
  );

  const updateQuantity = useCallback(
    (productId: string, cantidad: number, variante?: string) => {
      if (cantidad <= 0) {
        setItems((prev) =>
          prev.filter(
            (i) => !(i.product.id === productId && i.variante === variante)
          )
        );
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.product.id === productId && i.variante === variante
            ? { ...i, cantidad }
            : i
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setIsOpen(false);
  }, []);

  // Memoizar para evitar recalcular en cada render si items no cambio
  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.cantidad, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.product.precio * i.cantidad, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        toastProduct,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
