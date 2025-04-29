"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VirtualListProps<T> {
  items: T[]
  height: number
  itemHeight: number
  itemsPerRow: number
  renderItem: (item: T) => React.ReactNode
}

export function VirtualList<T>({ items, height, itemHeight, itemsPerRow, renderItem }: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [clientHeight, setClientHeight] = useState(height)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 })

  // Initialize window dimensions on client side
  useEffect(() => {
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Adjust height for mobile
  const effectiveHeight = isMobile ? windowDimensions.height * 0.7 : height

  // Calculate the total height of all items
  const rowCount = Math.ceil(items.length / itemsPerRow)
  const totalHeight = rowCount * itemHeight

  // Calculate which items should be visible
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) * itemsPerRow)
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + clientHeight) / itemHeight) * itemsPerRow + itemsPerRow * 2, // Add extra buffer for smoother scrolling
  )

  // Handle scroll events with throttling for better performance
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          setScrollTop(containerRef.current.scrollTop)
          setShowScrollToTop(containerRef.current.scrollTop > 300)
        }
      })
    }
  }, [])

  // Scroll to top function
  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }
  }

  // Update client height on resize
  useEffect(() => {
    const updateClientHeight = () => {
      if (containerRef.current) {
        setClientHeight(containerRef.current.clientHeight)
      }
    }

    updateClientHeight()
    window.addEventListener("resize", updateClientHeight)
    return () => window.removeEventListener("resize", updateClientHeight)
  }, [])

  // Visible items
  const visibleItems = items.slice(startIndex, endIndex)

  // Calculate the offset for the visible items
  const offsetY = Math.floor(startIndex / itemsPerRow) * itemHeight

  // Determine grid columns based on screen size
  const gridCols = isMobile ? 1 : itemsPerRow

  return (
    <div className="relative">
      <div
        ref={containerRef}
        style={{ height: effectiveHeight, overflow: "auto" }}
        onScroll={handleScroll}
        className="relative scroll-smooth -webkit-overflow-scrolling-touch"
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: offsetY,
              left: 0,
              right: 0,
            }}
          >
            <div
              className={`grid gap-4`}
              style={{
                gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
              }}
            >
              {visibleItems.map((item, index) => (
                <div key={startIndex + index}>{renderItem(item)}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showScrollToTop && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
