import React from "react";
import { PaginatedList } from "./PaginatedList";
import { usePaginatedData } from "@/lib/utils";
import freeAPI from "@/BackendRoutes/FreeAPI";

interface Meal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strMealThumb: string;
  strTags: string | null;
  strYoutube: string;
  strInstructions: string;
}

const Meals_app = () => {
  const { items: meals, ...pagination } = usePaginatedData<Meal>({
    fetchFn: freeAPI.getMeals,
  });

  return (
    <PaginatedList
      title="Meals"
      items={meals}
      {...pagination}
      renderItem={(meal, i) => (
        <div
          key={meal.idMeal ?? i}
          className="flex gap-4 items-center rounded-md bg-white p-3 shadow cursor-pointer"
          onClick={() => {}}
        >
          <div className="text-sm text-muted-foreground w-6">{i + 1}.</div>

          <img
            src={meal.strMealThumb}
            alt={meal.strMeal}
            className="h-12 w-12 rounded-full object-cover"
          />

          <div>
            <div className="font-semibold">{meal.strMeal}</div>
            <div className="text-sm text-muted-foreground">
              {meal.strCategory} · {meal.strArea}
            </div>
            {meal.strTags && (
              <div className="text-xs text-muted-foreground">
                {meal.strTags}
              </div>
            )}
          </div>
        </div>
      )}
    />
  );
};

export default Meals_app;
