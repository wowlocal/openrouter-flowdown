// Cache utility functions for storing and retrieving data from localStorage

// Type for cached data with expiration
type CachedData<T> = {
  data: T
  timestamp: number
  expiry: number
}

// Default cache expiration time (24 hours in milliseconds)
const DEFAULT_CACHE_EXPIRY = 24 * 60 * 60 * 1000

/**
 * Store data in localStorage with expiration
 */
export function setCache<T>(key: string, data: T, expiry = DEFAULT_CACHE_EXPIRY): void {
  try {
    const item: CachedData<T> = {
      data,
      timestamp: Date.now(),
      expiry,
    }
    localStorage.setItem(key, JSON.stringify(item))
  } catch (error) {
    console.error("Error setting cache:", error)
  }
}

/**
 * Get data from localStorage if it exists and is not expired
 */
export function getCache<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    const cachedData: CachedData<T> = JSON.parse(item)
    const now = Date.now()

    // Check if the cache has expired
    if (now - cachedData.timestamp > cachedData.expiry) {
      localStorage.removeItem(key)
      return null
    }

    return cachedData.data
  } catch (error) {
    console.error("Error getting cache:", error)
    return null
  }
}

/**
 * Check if cache exists and is not expired
 */
export function hasValidCache(key: string): boolean {
  return getCache(key) !== null
}

/**
 * Get cache age in milliseconds
 */
export function getCacheAge(key: string): number | null {
  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    const cachedData = JSON.parse(item)
    return Date.now() - cachedData.timestamp
  } catch (error) {
    console.error("Error getting cache age:", error)
    return null
  }
}

/**
 * Clear specific cache
 */
export function clearCache(key: string): void {
  localStorage.removeItem(key)
}

/**
 * Format cache age to human readable string
 */
export function formatCacheAge(age: number | null): string {
  if (age === null) return "Never cached"

  const seconds = Math.floor(age / 1000)
  if (seconds < 60) return `${seconds} seconds ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}
