"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

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

  // Calculate the total height of all items
  const rowCount = Math.ceil(items.length / itemsPerRow)
  const totalHeight = rowCount * itemHeight

  // Calculate which items should be visible
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) * itemsPerRow)
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + clientHeight) / itemHeight) * itemsPerRow + itemsPerRow,
  )

  // Handle scroll events
  const handleScroll = () => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
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

  return (
    <div ref={containerRef} style={{ height, overflow: "auto" }} onScroll={handleScroll} className="relative">
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
            className={`grid grid-cols-1 md:grid-cols-${itemsPerRow === 2 ? "2" : itemsPerRow === 3 ? "3" : "1"} gap-4`}
          >
            {visibleItems.map((item, index) => (
              <div key={startIndex + index}>{renderItem(item)}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
