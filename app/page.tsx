import { Suspense } from "react"

import { ModelBrowser } from "@/components/model-browser"

function ModelBrowserFallback() {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      Loading models...
    </div>
  )
}

export default function Home() {
  return (
    <main className="container mx-auto py-4 px-4">
      <Suspense fallback={<ModelBrowserFallback />}>
        <ModelBrowser />
      </Suspense>
    </main>
  )
}
