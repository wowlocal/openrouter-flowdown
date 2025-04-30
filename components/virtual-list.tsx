"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
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
  const scrollingRef = useRef(false)
  const rafRef = useRef<number | null>(null)

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

  // Calculate which items should be visible - memoized for better performance
  const visibleData = useMemo(() => {
    // Calculate buffer for smoother scrolling (render more items than visible)
    const buffer = 2 * itemsPerRow

    // Calculate start and end indices
    const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - 1)
    const endRow = Math.min(rowCount, Math.ceil((scrollTop + clientHeight) / itemHeight) + 2)

    const startIndex = startRow * itemsPerRow
    const endIndex = Math.min(items.length, endRow * itemsPerRow + buffer)

    // Calculate offset for positioning
    const offsetY = startRow * itemHeight

    // Get visible items
    const visibleItems = items.slice(startIndex, endIndex)

    return { visibleItems, offsetY, startIndex }
  }, [items, scrollTop, clientHeight, itemHeight, itemsPerRow, rowCount])

  // Handle scroll events with optimized performance
  const handleScroll = useCallback(() => {
    if (!containerRef.current || scrollingRef.current) return

    scrollingRef.current = true

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    rafRef.current = requestAnimationFrame(() => {
      if (containerRef.current) {
        setScrollTop(containerRef.current.scrollTop)
        setShowScrollToTop(containerRef.current.scrollTop > 300)
      }
      scrollingRef.current = false
    })
  }, [])

  // Scroll to top function with smooth behavior
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

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  // Determine grid columns based on screen size
  const gridCols = isMobile ? 1 : itemsPerRow

  return (
    <div className="relative">
      <div
        ref={containerRef}
        style={{
          height: effectiveHeight,
          overflow: "auto",
          willChange: "transform", // Hint to browser to use GPU
          WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
        }}
        onScroll={handleScroll}
        className="relative scroll-smooth"
      >
        <div
          style={{
            height: totalHeight,
            position: "relative",
            willChange: "contents",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: visibleData.offsetY,
              left: 0,
              right: 0,
              transform: "translate3d(0, 0, 0)", // Force GPU acceleration
            }}
          >
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
              }}
            >
              {visibleData.visibleItems.map((item, index) => (
                <div key={visibleData.startIndex + index} style={{ willChange: "transform" }}>
                  {renderItem(item)}
                </div>
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
