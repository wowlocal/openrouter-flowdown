"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface VirtualListProps<T> {
  items: T[]
  height: number
  itemHeight: number
  itemsPerRow: number
  renderItem: (item: T) => React.ReactNode
  page?: number
  onPageChange?: (page: number) => void
}

export function VirtualList<T>({
  items,
  height,
  itemsPerRow,
  renderItem,
  page,
  onPageChange,
}: VirtualListProps<T>) {
  const [internalPage, setInternalPage] = useState(1)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isControlled = typeof page === "number" && typeof onPageChange === "function"

  // Calculate items per page based on screen size
  const itemsPerPage = isMobile ? 6 : 12

  // Calculate total pages
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const maxPage = totalPages || 1
  const currentPage = isControlled ? page! : internalPage
  const clampedPage = Math.min(Math.max(currentPage, 1), maxPage)

  // Ensure the current page is always within bounds when items change
  useEffect(() => {
    if (currentPage === clampedPage) return

    if (isControlled) {
      onPageChange?.(clampedPage)
    } else {
      setInternalPage(clampedPage)
    }
  }, [currentPage, clampedPage, isControlled, onPageChange])

  // Get current page items
  const currentItems = useMemo(() => {
    const startIndex = (clampedPage - 1) * itemsPerPage
    return items.slice(startIndex, startIndex + itemsPerPage)
  }, [items, clampedPage, itemsPerPage])

  // Handle page changes
  const goToPage = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, maxPage))
    if (isControlled) {
      onPageChange?.(nextPage)
    } else {
      setInternalPage(nextPage)
    }
    // Scroll to top when changing pages
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // Determine grid columns based on screen size
  const gridCols = isMobile ? 1 : itemsPerRow

  // Generate pagination items
  const paginationItems = useMemo(() => {
    const items = []
    const maxVisiblePages = isMobile ? 3 : 5

    // Always show first page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => goToPage(1)} isActive={clampedPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Show ellipsis if needed
    if (clampedPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Show pages around current page
    const startPage = Math.max(2, clampedPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 2)

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => goToPage(i)} isActive={clampedPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Show ellipsis if needed
    if (clampedPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Always show last page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => goToPage(totalPages)} isActive={clampedPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return items
  }, [clampedPage, totalPages, isMobile])

  return (
    <div className="space-y-6">
      <div
        style={{
          minHeight: isMobile ? "auto" : `${height * 0.8}px`,
        }}
      >
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          }}
        >
          {currentItems.map((item, index) => (
            <div key={index}>{renderItem(item)}</div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination className="justify-center">
          <PaginationContent>
            <PaginationPrevious
              onClick={() => goToPage(clampedPage - 1)}
              className={clampedPage === 1 ? "pointer-events-none opacity-50" : ""}
            />

            {paginationItems}

            <PaginationNext
              onClick={() => goToPage(clampedPage + 1)}
              className={clampedPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationContent>
        </Pagination>
      )}

      {totalPages > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Page {clampedPage} of {totalPages} ({items.length} items)
        </div>
      )}
    </div>
  )
}
