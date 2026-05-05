import { Field, FieldLabel } from "@/components/ui/field";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationIconsOnlyProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function PaginationIconsOnly({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationIconsOnlyProps) {
  const totalPages = Math.ceil(total / pageSize);
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;
  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-6 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground shadow-sm">
      {/* Rows per page */}
      <Field orientation="horizontal" className="w-fit items-center gap-2">
        <FieldLabel
          htmlFor="select-rows-per-page"
          className="whitespace-nowrap text-xs font-medium"
        >
          Rows per page
        </FieldLabel>
        <Select
          value={String(pageSize)}
          onValueChange={(val) => onPageSizeChange(Number(val))}
        >
          <SelectTrigger className="h-8 w-16 text-xs" id="select-rows-per-page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Result range */}
      <span className="whitespace-nowrap text-xs">
        <span className="font-semibold text-foreground">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        of <span className="font-semibold text-foreground">{total}</span>
      </span>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Page indicator */}
      <span className="whitespace-nowrap text-xs">
        Page <span className="font-semibold text-foreground">{page}</span> of{" "}
        <span className="font-semibold text-foreground">{totalPages}</span>
      </span>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Navigation */}
      <Pagination className="mx-0 w-auto">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationPrevious
              onClick={hasPrevious ? () => onPageChange(page - 1) : undefined}
              aria-disabled={!hasPrevious}
              className={
                !hasPrevious
                  ? "pointer-events-none opacity-40"
                  : "cursor-pointer hover:bg-accent hover:text-accent-foreground"
              }
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={hasNext ? () => onPageChange(page + 1) : undefined}
              aria-disabled={!hasNext}
              className={
                !hasNext
                  ? "pointer-events-none opacity-40"
                  : "cursor-pointer hover:bg-accent hover:text-accent-foreground"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
