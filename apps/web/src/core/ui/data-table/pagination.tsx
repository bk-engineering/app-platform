import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../button";

export function DataTablePagination({
  page,
  onPageChange,
  hasNextPage,
  label,
}: {
  page: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  label: (page: number) => string;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-sm text-muted-foreground">{label(page)}</span>
      <Button
        variant="outline"
        size="icon"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
