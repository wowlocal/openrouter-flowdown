"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OPENROUTER_API_KEY } from "@/components/settings-modal"
import { BookText, BookOpen, Library, Sparkles } from "lucide-react"

interface ExportConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (token: string, contextLength: number) => void
  modelContextLength: number
}

const FLOWDOWN_INFINITY = 2_147_483_647

// Define context length options with their display names and values (mirrors FlowDown)
const contextLengthOptions = [
  { value: 4_000, display: "Short 4k", icon: BookText },
  { value: 8_000, display: "Short 8k", icon: BookText },
  { value: 16_000, display: "Medium 16k", icon: BookOpen },
  { value: 32_000, display: "Medium 32k", icon: BookOpen },
  { value: 64_000, display: "Medium 64k", icon: BookOpen },
  { value: 100_000, display: "Long 100k", icon: Library },
  { value: 200_000, display: "Long 200k", icon: Library },
  { value: 1_000_000, display: "Huge 1M", icon: Library },
  { value: FLOWDOWN_INFINITY, display: "Infinity", icon: Sparkles },
]

export function ExportConfigModal({ isOpen, onClose, onExport, modelContextLength }: ExportConfigModalProps) {
  const [token, setToken] = useState("")
  const [contextLength, setContextLength] = useState<string>("")
  const [showTokenWarning, setShowTokenWarning] = useState(false)
  const [hasSavedToken, setHasSavedToken] = useState(false)
  const selectRef = useRef<HTMLButtonElement>(null)
  const exportButtonRef = useRef<HTMLButtonElement>(null)

  // Get the closest allowed context length (prefers the nearest FlowDown value, rounding up on ties)
  function getClosestContextLength(originalLength: number): number {
    if (!Number.isFinite(originalLength) || originalLength <= 0) {
      return FLOWDOWN_INFINITY
    }

    const infinityOption = contextLengthOptions.find((option) => option.value === FLOWDOWN_INFINITY)
    const finiteOptions = contextLengthOptions.filter((option) => option.value !== FLOWDOWN_INFINITY)

    if (finiteOptions.length === 0) {
      return infinityOption?.value ?? FLOWDOWN_INFINITY
    }

    const smallestFinite = finiteOptions[0]
    const largestFinite = finiteOptions[finiteOptions.length - 1]

    if (originalLength <= smallestFinite.value) {
      return smallestFinite.value
    }

    if (originalLength >= largestFinite.value * 1.25) {
      return infinityOption?.value ?? largestFinite.value
    }

    if (originalLength >= largestFinite.value) {
      return largestFinite.value
    }

    for (let i = 0; i < finiteOptions.length; i++) {
      const current = finiteOptions[i]
      if (originalLength === current.value) {
        return current.value
      }

      if (originalLength < current.value) {
        const previous = finiteOptions[i - 1]
        if (!previous) {
          return current.value
        }

        const distanceDown = originalLength - previous.value
        const distanceUp = current.value - originalLength
        return distanceDown < distanceUp ? previous.value : current.value
      }
    }

    return largestFinite.value
  }

  // Load saved token when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedToken = localStorage.getItem(OPENROUTER_API_KEY)
      if (savedToken) {
        setToken(savedToken)
        setHasSavedToken(true)

        // Focus on the select element or export button instead of the token input
        // Use a short timeout to ensure the modal is fully rendered
        setTimeout(() => {
          if (selectRef.current) {
            selectRef.current.focus()
          } else if (exportButtonRef.current) {
            exportButtonRef.current.focus()
          }
        }, 50)
      } else {
        setHasSavedToken(false)
      }

      // Set the closest context length option
      const closestLength = getClosestContextLength(modelContextLength)
      setContextLength(closestLength.toString())
      setShowTokenWarning(false)
    }
  }, [isOpen, modelContextLength])

  const handleExport = () => {
    if (!token.trim().startsWith("sk-or-")) {
      setShowTokenWarning(true)
      return
    }

    onExport(token, Number.parseInt(contextLength, 10))
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Model Configuration</DialogTitle>
          <DialogDescription>
            Create a configuration file for this model. {!hasSavedToken && "You'll need your OpenRouter API token."}
          </DialogDescription>
        </DialogHeader>

        {showTokenWarning && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please enter a valid OpenRouter token starting with "sk-or-"</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="token" className="col-span-4">
              OpenRouter API Token
            </Label>
            <Input
              id="token"
              placeholder="sk-or-v1-..."
              className="col-span-4"
              value={token}
              onChange={(e) => {
                setToken(e.target.value)
                setShowTokenWarning(false)
              }}
              type="password"
              autoFocus={!hasSavedToken}
            />
            {hasSavedToken && (
              <p className="col-span-4 text-xs text-muted-foreground">
                Using your saved API key. You can change it in Settings if needed.
              </p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="context" className="col-span-4">
              Context Length
            </Label>
            <Select value={contextLength} onValueChange={setContextLength}>
              <SelectTrigger ref={selectRef} className="col-span-4">
                <SelectValue placeholder="Select context length" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {contextLengthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()} className="flex items-center">
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <span>{option.display}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button ref={exportButtonRef} onClick={handleExport}>
            Export Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
