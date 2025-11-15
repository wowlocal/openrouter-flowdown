import Link from "next/link"
import { Github } from "lucide-react"

import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-10 text-center">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Open Source</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="bg-background/70 text-base font-semibold shadow-sm backdrop-blur"
          >
            <Link href="https://github.com/Lakr233/FlowDown" target="_blank" rel="noreferrer">
              <Github className="size-4" />
              FlowDown
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="bg-background/70 text-base font-semibold shadow-sm backdrop-blur"
          >
            <Link href="https://github.com/wowlocal/openrouter-flowdown" target="_blank" rel="noreferrer">
              <Github className="size-4" />
              Model Browser
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Star the repos, file issues.</p>
      </div>
    </footer>
  )
}

