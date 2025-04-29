"use client"

import React from "react"

import { useState, useCallback, useMemo } from "react"
import { Search, SlidersHorizontal, Zap, Clock, Hash, RefreshCw, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModelDetails } from "@/components/model-details"
import { useDebounce } from "@/hooks/use-debounce"
import { VirtualList } from "@/components/virtual-list"
import { useModels, type Model } from "@/hooks/use-models"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

// Helper function to format pricing
const formatPrice = (price: string): string => {
  const num = Number.parseFloat(price)
  if (num === 0) return "Free"
  return `$${num.toFixed(7)}/token`
}

// Helper to get provider name from model ID
const getProvider = (id: string): string => {
  const parts = id.split("/")
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
}

// Helper to get model name without provider
const getModelName = (fullName: string): string => {
  const colonIndex = fullName.indexOf(":")
  const nameWithoutTag = colonIndex > -1 ? fullName.substring(0, colonIndex) : fullName
  const parts = nameWithoutTag.split(": ")
  return parts.length > 1 ? parts[1] : nameWithoutTag
}

// Helper to check if model is free
const isFree = (model: Model): boolean => {
  return Number.parseFloat(model.pricing.prompt) === 0 && Number.parseFloat(model.pricing.completion) === 0
}

// Memoized model card component for better performance
const ModelCard = React.memo(({ model, onSelect }: { model: Model; onSelect: (model: Model) => void }) => {
  return (
    <Card
      className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer h-full"
      onClick={() => onSelect(model)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="mb-2">
            {getProvider(model.id)}
          </Badge>
          {isFree(model) && (
            <Badge
              variant="secondary"
              className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-500"
            >
              Free
            </Badge>
          )}
        </div>
        <CardTitle className="line-clamp-1">{getModelName(model.name)}</CardTitle>
        <CardDescription className="line-clamp-1">{model.id}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-3">{model.description}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 pt-2">
        <div className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
          <Clock className="h-3 w-3" />
          <span>{new Date(model.created * 1000).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
          <Hash className="h-3 w-3" />
          <span>{model.context_length.toLocaleString()} tokens</span>
        </div>
      </CardFooter>
    </Card>
  )
})
ModelCard.displayName = "ModelCard"

// Memoized model list item component for better performance
const ModelListItem = React.memo(({ model, onSelect }: { model: Model; onSelect: (model: Model) => void }) => {
  return (
    <div
      className="flex flex-col sm:flex-row justify-between gap-4 p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
      onClick={() => onSelect(model)}
    >
      <div className="space-y-1 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium">{getModelName(model.name)}</h3>
          <Badge variant="outline" size="sm">
            {getProvider(model.id)}
          </Badge>
          {isFree(model) && (
            <Badge
              variant="secondary"
              className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-500"
            >
              Free
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">{model.id}</p>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
          <Clock className="h-3 w-3" />
          <span>{new Date(model.created * 1000).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
          <Hash className="h-3 w-3" />
          <span>{model.context_length.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
          <Zap className="h-3 w-3" />
          <span>{formatPrice(model.pricing.completion)}</span>
        </div>
      </div>
    </div>
  )
})
ModelListItem.displayName = "ModelListItem"

export function ModelBrowser() {
  const [searchInputValue, setSearchInputValue] = useState("")
  const debouncedSearchQuery = useDebounce(searchInputValue, 300)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [filters, setFilters] = useState({
    freeOnly: false,
    providers: new Set<string>(),
  })
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Use the custom hook for models with caching
  const { models, isLoading, isRefreshing, error, cacheStatus, refreshModels } = useModels()

  // Get unique providers for filtering - memoized to prevent recalculation
  const providers = useMemo(() => {
    if (!models) return []
    return [...new Set(models.map((model) => getProvider(model.id)))]
  }, [models])

  // Filter models based on search and filters - memoized for performance
  const filteredModels = useMemo(() => {
    if (!models) return []

    // Create a search index for faster lookups
    const searchTerms = debouncedSearchQuery.toLowerCase().split(/\s+/).filter(Boolean)

    return models.filter((model) => {
      // Skip filtering if no search terms
      const matchesSearch =
        searchTerms.length === 0 ||
        searchTerms.every(
          (term) =>
            model.name.toLowerCase().includes(term) ||
            model.description.toLowerCase().includes(term) ||
            model.id.toLowerCase().includes(term),
        )

      // Free only filter
      const matchesFree = filters.freeOnly ? isFree(model) : true

      // Provider filter
      const matchesProvider = filters.providers.size === 0 || filters.providers.has(getProvider(model.id))

      return matchesSearch && matchesFree && matchesProvider
    })
  }, [models, debouncedSearchQuery, filters])

  // Handle provider filter toggle - memoized callback
  const toggleProviderFilter = useCallback((provider: string) => {
    setFilters((prev) => {
      const newProviders = new Set(prev.providers)
      if (newProviders.has(provider)) {
        newProviders.delete(provider)
      } else {
        newProviders.add(provider)
      }
      return { ...prev, providers: newProviders }
    })
  }, [])

  // Handle model selection for details view - memoized callback
  const handleModelSelect = useCallback((model: Model) => {
    setSelectedModel(model)
  }, [])

  // Handle back from details view - memoized callback
  const handleBack = useCallback(() => {
    setSelectedModel(null)
  }, [])

  // Handle search input change - direct update without debounce for responsive UI
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value)
  }, [])

  // Clear search input
  const clearSearch = useCallback(() => {
    setSearchInputValue("")
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      freeOnly: false,
      providers: new Set<string>(),
    })
  }, [])

  if (error && !models) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Error loading models. Please try again later.</p>
        <Button onClick={refreshModels}>Retry</Button>
      </div>
    )
  }

  // If a model is selected, show its details
  if (selectedModel) {
    return <ModelDetails model={selectedModel} onBack={handleBack} />
  }

  // Determine grid columns based on screen size
  const itemsPerRow = isMobile ? 1 : window.innerWidth >= 1024 ? 3 : 2

  // Render grid view with virtualization for better performance
  const renderGridView = () => {
    return (
      <VirtualList
        items={filteredModels}
        height={isMobile ? window.innerHeight * 0.7 : 800}
        itemHeight={320}
        itemsPerRow={itemsPerRow}
        renderItem={(model) => (
          <div className="p-2 h-full">
            <ModelCard model={model} onSelect={handleModelSelect} />
          </div>
        )}
      />
    )
  }

  // Render list view with virtualization for better performance
  const renderListView = () => {
    return (
      <VirtualList
        items={filteredModels}
        height={isMobile ? window.innerHeight * 0.7 : 800}
        itemHeight={isMobile ? 140 : 100}
        itemsPerRow={1}
        renderItem={(model) => (
          <div className="py-1">
            <ModelListItem model={model} onSelect={handleModelSelect} />
          </div>
        )}
      />
    )
  }

  // Render filters for mobile
  const renderMobileFilters = () => (
    <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {(filters.freeOnly || filters.providers.size > 0) && (
            <Badge variant="secondary" className="ml-1">
              {filters.providers.size + (filters.freeOnly ? 1 : 0)}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Filter models by provider and other criteria</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Free models only</h3>
            <Button
              variant={filters.freeOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, freeOnly: !prev.freeOnly }))}
            >
              {filters.freeOnly ? "Enabled" : "Disabled"}
            </Button>
          </div>

          <div className="mb-2">
            <h3 className="text-sm font-medium mb-2">Providers</h3>
            <div className="grid grid-cols-2 gap-2">
              {providers.map((provider) => (
                <Button
                  key={provider}
                  variant={filters.providers.has(provider) ? "default" : "outline"}
                  size="sm"
                  className="justify-start"
                  onClick={() => toggleProviderFilter(provider)}
                >
                  {provider}
                </Button>
              ))}
            </div>
          </div>

          {(filters.freeOnly || filters.providers.size > 0) && (
            <Button variant="ghost" className="mt-4 w-full" onClick={clearFilters}>
              Clear all filters
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )

  // Render filters for desktop
  const renderDesktopFilters = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {(filters.freeOnly || filters.providers.size > 0) && (
            <Badge variant="secondary" className="ml-1">
              {filters.providers.size + (filters.freeOnly ? 1 : 0)}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuCheckboxItem
          checked={filters.freeOnly}
          onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, freeOnly: checked }))}
        >
          Free models only
        </DropdownMenuCheckboxItem>

        <div className="px-2 py-1.5 text-sm font-semibold">Providers</div>
        {providers.map((provider) => (
          <DropdownMenuCheckboxItem
            key={provider}
            checked={filters.providers.has(provider)}
            onCheckedChange={() => toggleProviderFilter(provider)}
          >
            {provider}
          </DropdownMenuCheckboxItem>
        ))}

        {(filters.freeOnly || filters.providers.size > 0) && (
          <div className="px-2 py-1.5">
            <Button variant="ghost" size="sm" className="w-full" onClick={clearFilters}>
              Clear all filters
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            className="pl-8 pr-8"
            value={searchInputValue}
            onChange={handleSearchChange}
          />
          {searchInputValue && (
            <button
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 w-full justify-between">
          <div className="flex gap-2">
            {isMobile ? renderMobileFilters() : renderDesktopFilters()}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={refreshModels}
                    disabled={isRefreshing}
                    className={isRefreshing ? "animate-spin" : ""}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh models</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh models (last updated: {cacheStatus})</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Tabs defaultValue="grid" className="w-auto" onValueChange={(v) => setView(v as "grid" | "list")}>
            <TabsList className="grid w-20 grid-cols-2">
              <TabsTrigger value="grid" className="px-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-grid-2x2"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 12h18" />
                  <path d="M12 3v18" />
                </svg>
              </TabsTrigger>
              <TabsTrigger value="list" className="px-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-list"
                >
                  <line x1="8" x2="21" y1="6" y2="6" />
                  <line x1="8" x2="21" y1="12" y2="12" />
                  <line x1="8" x2="21" y1="18" y2="18" />
                  <line x1="3" x2="3.01" y1="6" y2="6" />
                  <line x1="3" x2="3.01" y1="12" y2="12" />
                  <line x1="3" x2="3.01" y1="18" y2="18" />
                </svg>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isLoading && !models ? (
        <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredModels.length > 0 ? (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredModels.length} of {models?.length} models
            </p>
            {isRefreshing && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Refreshing...
              </p>
            )}
          </div>

          {view === "grid" ? renderGridView() : renderListView()}
        </>
      ) : (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">No models found matching your criteria</p>
          {(searchInputValue || filters.freeOnly || filters.providers.size > 0) && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                clearSearch()
                clearFilters()
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
