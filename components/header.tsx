"use client"

import { useState } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { SettingsModal } from "@/components/settings-modal"

export function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <header className="border-b">
      <div className="container mx-auto py-4 px-4 flex justify-between items-center">
        <div className="font-semibold text-xl">OpenRouter Model Browser</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)} aria-label="Settings">
            <Settings className="h-[1.2rem] w-[1.2rem]" />
          </Button>
          <ModeToggle />
        </div>
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  )
}
