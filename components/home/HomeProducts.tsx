"use client";

import ProductCard from "@/components/catalog/ProductCard";
import type { Product } from "@/types";

export default function HomeProducts({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="text-text-muted text-center py-8">
        Proximamente mas productos...
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
