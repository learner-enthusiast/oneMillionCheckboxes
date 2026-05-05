import React from "react";
import { PaginatedList } from "./PaginatedList";
import { usePaginatedData } from "@/lib/utils";
import freeAPI from "@/BackendRoutes/FreeAPI";

interface Cat {
  id: number;
  name: string;
  origin: string;
  temperament: string;
  description: string;
  life_span: string;
  image: string;
  affection_level: number;
  energy_level: number;
  intelligence: number;
  weight: {
    imperial: string;
    metric: string;
  };
}

const RCat_app = () => {
  const { items: cats, ...pagination } = usePaginatedData<Cat>({
    fetchFn: freeAPI.getRandomCats,
  });

  return (
    <PaginatedList
      title="Cat Breeds"
      items={cats}
      {...pagination}
      renderItem={(cat, i) => (
        <div
          key={cat.id ?? i}
          className="flex gap-4 items-center rounded-md bg-white p-3 shadow cursor-pointer"
          onClick={() => {}}
        >
          <div className="text-sm text-muted-foreground w-6">{i + 1}.</div>

          <img
            src={cat.image}
            alt={cat.name}
            className="h-12 w-12 rounded-full object-cover"
          />

          <div>
            <div className="font-semibold">{cat.name}</div>
            <div className="text-sm text-muted-foreground">
              {cat.origin} · {cat.life_span} yrs · {cat.weight.metric} kg
            </div>
            <div className="text-xs text-muted-foreground">
              {cat.temperament}
            </div>
          </div>
        </div>
      )}
    />
  );
};

export default RCat_app;
