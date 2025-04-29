import { ModelBrowser } from "@/components/model-browser"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">OpenRouter Models</h1>
          <p className="text-muted-foreground">Browse all available AI models from OpenRouter's unified API gateway</p>
        </div>
        <ModelBrowser />
      </div>
    </main>
  )
}
