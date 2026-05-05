import freeAPI from "@/BackendRoutes/FreeAPI";
import { usePaginatedData } from "@/lib/utils";
import React from "react";
import { PaginatedList } from "./PaginatedList";

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

const Listing_app = () => {
  const { items: products, ...pagination } = usePaginatedData<Product>({
    fetchFn: freeAPI.getRandomProducts,
  });

  return (
    <PaginatedList
      title="Products"
      items={products}
      {...pagination}
      renderItem={(product, i) => (
        <div
          key={product.id ?? i}
          className="flex gap-4 items-center rounded-md bg-white p-3 shadow cursor-pointer"
          onClick={() => {}}
        >
          <div className="text-sm text-muted-foreground w-6">{i + 1}.</div>

          <img
            src={product.thumbnail}
            alt={product.title}
            className="h-12 w-12 rounded-md object-cover"
          />

          <div className="flex-1">
            <div className="font-semibold">{product.title}</div>
            <div className="text-sm text-muted-foreground">
              {product.brand} · {product.category}
            </div>
            <div className="text-xs text-muted-foreground">
              ⭐ {product.rating} · 📦 {product.stock} in stock
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-semibold">${product.price}</div>
            <div className="text-xs text-green-600">
              -{product.discountPercentage}% off
            </div>
          </div>
        </div>
      )}
    />
  );
};

export default Listing_app;
