import freeAPI from "@/BackendRoutes/FreeAPI";
import { usePaginatedData } from "@/lib/utils";
import React from "react";
import { PaginatedList } from "./PaginatedList";

interface Quote {
  id: number;
  content: string;
  author: string;
  authorSlug: string;
  tags: string[];
  length: number;
  dateAdded: string;
  dateModified: string;
}

const Quotes_app = () => {
  const { items: quotes, ...pagination } = usePaginatedData<Quote>({
    fetchFn: freeAPI.getQuotes,
  });

  return (
    <PaginatedList
      title="Quotes"
      items={quotes}
      {...pagination}
      renderItem={(quote, i) => (
        <div
          key={quote.id ?? i}
          className="flex gap-4 items-start rounded-md bg-white p-3 shadow cursor-pointer"
          onClick={() => {}}
        >
          <div className="text-sm text-muted-foreground w-6 pt-1">{i + 1}.</div>

          <div className="flex-1">
            <div className="font-semibold">"{quote.content}"</div>
            <div className="text-sm text-muted-foreground mt-1">
              — {quote.author}
            </div>
            {quote.tags.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {quote.tags.join(", ")}
              </div>
            )}
          </div>
        </div>
      )}
    />
  );
};

export default Quotes_app;
