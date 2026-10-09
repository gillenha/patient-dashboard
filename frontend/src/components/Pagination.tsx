import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

type Props = {
  page: number
  pages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pages, total, pageSize, onPageChange }: Props) {
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-muted-foreground text-sm tabular-nums">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <span className="text-sm tabular-nums">
          Page {page} of {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  )
}
