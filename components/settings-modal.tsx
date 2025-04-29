"use client"

import { useState, useEffect } from "react"
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
import { AlertCircle, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Local storage key for the OpenRouter API key
export const OPENROUTER_API_KEY = "openrouter-api-key"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("")
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [showKeyWarning, setShowKeyWarning] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load the saved API key when the modal opens
  useEffect(() => {
    if (isOpen) {
      const savedApiKey = localStorage.getItem(OPENROUTER_API_KEY)
      setSavedKey(savedApiKey)
      setApiKey(savedApiKey || "")
      setSaveSuccess(false)
    }
  }, [isOpen])

  const handleSaveKey = () => {
    if (!apiKey.trim().startsWith("sk-or-")) {
      setShowKeyWarning(true)
      return
    }

    localStorage.setItem(OPENROUTER_API_KEY, apiKey)
    setSavedKey(apiKey)
    setSaveSuccess(true)
    setShowKeyWarning(false)

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false)
    }, 3000)
  }

  const handleClearKey = () => {
    localStorage.removeItem(OPENROUTER_API_KEY)
    setApiKey("")
    setSavedKey(null)
    setSaveSuccess(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your OpenRouter API key to use when exporting model configurations.
          </DialogDescription>
        </DialogHeader>

        {showKeyWarning && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please enter a valid OpenRouter token starting with "sk-or-"</AlertDescription>
          </Alert>
        )}

        {saveSuccess && (
          <Alert className="my-2 border-green-500 text-green-500">
            <Check className="h-4 w-4" />
            <AlertDescription>API key saved successfully!</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="col-span-4">
              OpenRouter API Key
            </Label>
            <Input
              id="apiKey"
              placeholder="sk-or-v1-..."
              className="col-span-4"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                setShowKeyWarning(false)
              }}
              type="password"
            />
            {savedKey && (
              <p className="col-span-4 text-xs text-muted-foreground">
                You have a saved API key. It will be used automatically when exporting configurations.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {savedKey && (
              <Button variant="outline" onClick={handleClearKey} className="text-destructive">
                Clear Key
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveKey}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
