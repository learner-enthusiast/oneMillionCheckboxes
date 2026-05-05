import { PaginationIconsOnly } from "@/components/ui/pagination-icons-only";

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
    <div>
      <h3 className="mb-4 text-lg font-medium">{title}</h3>

      {loading && <div className="py-4">Loading...</div>}
      {error && <div className="py-4 text-destructive">{error}</div>}

      <div className="grid gap-3">
        {items.map((item, i) => renderItem(item, i))}
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
