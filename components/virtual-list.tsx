"use client"

import type React from "react"
import { useState, useMemo } from "react"
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
}

export function VirtualList<T>({ items, height, itemsPerRow, renderItem }: VirtualListProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Calculate items per page based on screen size
  const itemsPerPage = isMobile ? 6 : 12

  // Calculate total pages
  const totalPages = Math.ceil(items.length / itemsPerPage)

  // Get current page items
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return items.slice(startIndex, startIndex + itemsPerPage)
  }, [items, currentPage, itemsPerPage])

  // Handle page changes
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
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
          <PaginationLink onClick={() => goToPage(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Show ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Show pages around current page
    const startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 2)

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => goToPage(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Show ellipsis if needed
    if (currentPage < totalPages - 2) {
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
          <PaginationLink onClick={() => goToPage(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return items
  }, [currentPage, totalPages, isMobile])

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
              onClick={() => goToPage(currentPage - 1)}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />

            {paginationItems}

            <PaginationNext
              onClick={() => goToPage(currentPage + 1)}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationContent>
        </Pagination>
      )}

      {totalPages > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Page {currentPage} of {totalPages} ({items.length} items)
        </div>
      )}
    </div>
  )
}
