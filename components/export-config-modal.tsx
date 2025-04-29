"use client"

import { useState } from "react"
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

interface ExportConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (token: string, contextLength: number) => void
  modelContextLength: number
}

export function ExportConfigModal({ isOpen, onClose, onExport, modelContextLength }: ExportConfigModalProps) {
  const [token, setToken] = useState("")
  const [contextLength, setContextLength] = useState<string>(getClosestContextLength(modelContextLength).toString())
  const [showTokenWarning, setShowTokenWarning] = useState(false)

  // Get the closest allowed context length
  function getClosestContextLength(originalLength: number): number {
    const allowedLengths = [32000, 64000, 128000, 1000000]
    // Find the smallest allowed length that is >= the original
    for (const length of allowedLengths) {
      if (originalLength <= length) {
        return length
      }
    }
    // If original is larger than all allowed values, return the largest allowed
    return allowedLengths[allowedLengths.length - 1]
  }

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
            Create a configuration file for this model. You'll need your OpenRouter API token.
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
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="context" className="col-span-4">
              Context Length
            </Label>
            <Select value={contextLength} onValueChange={setContextLength}>
              <SelectTrigger className="col-span-4">
                <SelectValue placeholder="Select context length" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="32000">32,000 tokens</SelectItem>
                <SelectItem value="64000">64,000 tokens</SelectItem>
                <SelectItem value="128000">128,000 tokens</SelectItem>
                <SelectItem value="1000000">1,000,000 tokens</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Export Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
