import React from "react";
import { PaginatedList } from "./PaginatedList";
import { usePaginatedData } from "@/lib/utils";
import freeAPI from "@/BackendRoutes/FreeAPI";

interface Joke {
  id: number;
  content: string;
  categories: string[];
}

const Jokes_app = () => {
  const { items: jokes, ...pagination } = usePaginatedData<Joke>({
    fetchFn: freeAPI.getRandomJokes,
  });

  return (
    <PaginatedList
      title="Chuck Norris Jokes"
      items={jokes}
      {...pagination}
      renderItem={(joke, i) => (
        <div
          key={joke.id ?? i}
          className="flex gap-4 items-start rounded-md bg-white p-3 shadow cursor-pointer"
          onClick={() => {}}
        >
          <div className="text-sm text-muted-foreground w-6 pt-1">{i + 1}.</div>

          <div className="flex-1">
            <div className="font-semibold">{joke.content}</div>
            {joke.categories.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {joke.categories.join(", ")}
              </div>
            )}
          </div>
        </div>
      )}
    />
  );
};

export default Jokes_app;
