import { PaginationIconsOnly } from "@/components/ui/pagination-icons-only";
import { Skeleton } from "@/components/ui/skeleton";

interface PaginatedListProps<T> {
  title: string;
  items: T[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
}

export function PaginatedList<T>({
  title,
  items,
  loading,
  error,
  page,
  limit,
  total,
  onPageChange,
  onPageSizeChange,
  renderItem,
  emptyMessage = "No items found.",
}: PaginatedListProps<T>) {
  return (
    <div className="backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-medium">{title}</h3>

      {error && <div className="py-4 text-destructive">{error}</div>}

      <div className="grid gap-3">
        {loading
          ? Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 items-center rounded-md bg-white p-3 shadow"
              >
                {/* index number */}
                <Skeleton className="h-4 w-6 shrink-0" />

                {/* avatar / thumbnail */}
                <Skeleton className="h-12 w-12 shrink-0" />

                {/* text lines */}
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))
          : items.map((item, i) => renderItem(item, i))}

        {!loading && items.length === 0 && (
          <div className="py-4 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>

      <div className="mt-4">
        <PaginationIconsOnly
          page={page}
          pageSize={limit}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
}
