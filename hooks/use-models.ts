"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { getCache, setCache, hasValidCache, getCacheAge, formatCacheAge } from "@/lib/cache"

// Define model type based on the API response
export type Model = {
  id: string
  name: string
  created: number
  description: string
  context_length: number
  architecture: {
    modality: string
    input_modalities: string[]
    output_modalities: string[]
    tokenizer: string
    instruct_type: string | null
  }
  pricing: {
    prompt: string
    completion: string
    request: string
    image: string
    web_search: string
    internal_reasoning: string
  }
  top_provider: {
    context_length: number
    max_completion_tokens: number | null
    is_moderated: boolean
  }
  per_request_limits: any
  supported_parameters: string[]
}

type ModelsResponse = {
  data: Model[]
}

// Cache keys
const MODELS_CACHE_KEY = "openrouter-models"
const MODELS_QUERY_KEY = ["openrouter-models"]

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Function to fetch models from OpenRouter API
const fetchModels = async (): Promise<Model[]> => {
  // Add a timeout to the fetch request
  const fetchWithTimeout = async (url: string, options = {}, timeout = 10000) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(id)
      return response
    } catch (error) {
      clearTimeout(id)
      throw error
    }
  }

  try {
    const response = await fetchWithTimeout("https://openrouter.ai/api/v1/models")
    const data: ModelsResponse = await response.json()

    // Cache the fresh data if in browser
    if (isBrowser) {
      setCache(MODELS_CACHE_KEY, data.data)
    }

    return data.data
  } catch (error) {
    console.error("Error fetching models:", error)

    // If we have cached data, return it as a fallback
    if (isBrowser) {
      const cachedData = getCache<Model[]>(MODELS_CACHE_KEY)
      if (cachedData) {
        return cachedData
      }
    }

    throw error
  }
}

export function useModels() {
  const queryClient = useQueryClient()
  const [cacheStatus, setCacheStatus] = useState<string>("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Check for cached data on mount (client-side only)
  useEffect(() => {
    const updateCacheStatus = () => {
      if (isBrowser) {
        const cacheAge = getCacheAge(MODELS_CACHE_KEY)
        setCacheStatus(formatCacheAge(cacheAge))
      }
    }

    updateCacheStatus()
    // Update cache status every minute
    const interval = setInterval(updateCacheStatus, 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Use React Query with optimized caching strategy
  const {
    data: models,
    isLoading,
    error,
    isFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: MODELS_QUERY_KEY,
    queryFn: fetchModels,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // Use cached data if available (client-side only)
    initialData: () => {
      if (isBrowser) {
        const cachedData = getCache<Model[]>(MODELS_CACHE_KEY)
        return cachedData || undefined
      }
      return undefined
    },
    // Only refetch if cache is older than 30 minutes
    refetchOnReconnect: isBrowser && hasValidCache(MODELS_CACHE_KEY) ? false : "always",
  })

  // Function to manually refresh data
  const refreshModels = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.fetchQuery(MODELS_QUERY_KEY, fetchModels, {
        staleTime: 0,
      })
      if (isBrowser) {
        const cacheAge = getCacheAge(MODELS_CACHE_KEY)
        setCacheStatus(formatCacheAge(cacheAge))
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  return {
    models,
    isLoading: isLoading && !models, // Only show loading if we don't have cached data
    isRefreshing: isFetching || isRefreshing,
    error,
    cacheStatus,
    refreshModels,
    dataUpdatedAt,
  }
}
