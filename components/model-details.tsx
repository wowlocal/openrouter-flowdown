"use client"

import { useState, useCallback } from "react"
import { ArrowLeft, Clock, Hash, Zap, Layers, Check, AlertCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExportConfigModal } from "@/components/export-config-modal"
import type { Model } from "@/hooks/use-models"
import { useMediaQuery } from "@/hooks/use-media-query"

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

// Helper to format date
const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Helper to generate a UUID
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16).toUpperCase()
  })
}

interface ModelDetailsProps {
  model: Model
  onBack: () => void
}

export function ModelDetails({ model, onBack }: ModelDetailsProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Generate code sample for the model
  const generateCodeSample = (modelId: string) => {
    return `import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const openrouter = createOpenRouter({
  apiKey: 'YOUR_OPENROUTER_API_KEY',
});

const { text } = await generateText({
  model: openrouter.chat('${modelId}'),
  prompt: 'What is OpenRouter?',
});

  console.log(text);`
    }

    // Handle export configuration
    const handleExportConfig = useCallback(
      (token: string, contextLength: number) => {
        // Determine capabilities based on model architecture
        const capabilities = []

        if (
          model.architecture.input_modalities.includes("image") ||
          model.architecture.output_modalities.includes("image")
        ) {
          capabilities.push("visual")
        }

        if (model.supported_parameters.includes("tools") || model.supported_parameters.includes("tool_choice")) {
          capabilities.push("tool")
        }

      // Generate current date in the required format
      const currentDate = new Date().toISOString().replace(/\.\d+Z$/, "Z")

      // Create the Flowdown model file contents (plist structured XML)
      const fdmodelContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>capabilities</key>
	<array>
${capabilities.map((cap) => `		<string>${cap}</string>`).join("\n")}
	</array>
	<key>comment</key>
	<string></string>
	<key>context</key>
	<integer>${contextLength}</integer>
	<key>creation</key>
	<date>${currentDate}</date>
	<key>endpoint</key>
	<string>https://openrouter.ai/api/v1/chat/completions</string>
	<key>id</key>
	<string>${generateUUID()}</string>
	<key>isProfileInControl</key>
	<true/>
	<key>model_identifier</key>
	<string>${model.id}</string>
	<key>model_list_endpoint</key>
	<string>$INFERENCE_ENDPOINT$/../../models</string>
	<key>token</key>
	<string>${token}</string>
</dict>
</plist>`

      // Create a blob and download the file
      const blob = new Blob([fdmodelContent], { type: "application/octet-stream" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${model.id.replace(/\//g, "-")}-config.fdmodel`

      // Set the correct content type for Flowdown model files
      if (navigator.userAgent.indexOf("Safari") !== -1 && navigator.userAgent.indexOf("Chrome") === -1) {
        // Special handling for Safari which handles content types differently
        a.setAttribute("type", "application/octet-stream")
      }

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    [model],
  )

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between sticky top-0 z-10 bg-background pt-2 pb-2 border-b">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to models
        </Button>

        <Button variant="default" className="flex items-center gap-2" onClick={() => setIsExportModalOpen(true)}>
          <Download className="h-4 w-4" />
          Export Configuration
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline">{getProvider(model.id)}</Badge>
            {isFree(model) && (
              <Badge
                variant="secondary"
                className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-500"
              >
                Free
              </Badge>
            )}
            {model.top_provider.is_moderated && (
              <Badge
                variant="outline"
                className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500"
              >
                Moderated
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold break-words">{getModelName(model.name)}</h1>
          <p className="text-sm text-muted-foreground mt-1 break-all">{model.id}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className={`${isMobile ? "w-full" : ""} grid grid-cols-3`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Context Length</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{model.context_length.toLocaleString()}</span>
                  <span className="text-muted-foreground">tokens</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Released</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-medium">{formatDate(model.created)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Modality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-medium capitalize">{model.architecture.modality}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{model.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Architecture</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground">Tokenizer</span>
                      <span className="text-sm font-medium">{model.architecture.tokenizer || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground">Instruct Type</span>
                      <span className="text-sm font-medium">{model.architecture.instruct_type || "Not specified"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground">Input Modalities</span>
                      <div className="flex flex-wrap gap-1">
                        {model.architecture.input_modalities.map((modality) => (
                          <Badge key={modality} variant="outline" className="capitalize">
                            {modality}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground">Output Modalities</span>
                      <div className="flex flex-wrap gap-1">
                        {model.architecture.output_modalities.map((modality) => (
                          <Badge key={modality} variant="outline" className="capitalize">
                            {modality}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Supported Parameters</h3>
                <div className="flex flex-wrap gap-2">
                  {model.supported_parameters.map((param) => (
                    <Badge key={param} variant="secondary">
                      {param}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Details</CardTitle>
              <CardDescription>Cost per token for different operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Prompt Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">{formatPrice(model.pricing.prompt)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Completion Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">{formatPrice(model.pricing.completion)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Request Fee</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-medium">{formatPrice(model.pricing.request)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Image Processing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-medium">{formatPrice(model.pricing.image)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Web Search</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-medium">{formatPrice(model.pricing.web_search)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Internal Reasoning</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-medium">{formatPrice(model.pricing.internal_reasoning)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Estimation</CardTitle>
              <CardDescription>Approximate costs for 1 million tokens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">1 Million Prompt Tokens</h3>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xl font-medium">
                      {Number.parseFloat(model.pricing.prompt) === 0
                        ? "Free"
                        : `$${(Number.parseFloat(model.pricing.prompt) * 1000000).toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">1 Million Completion Tokens</h3>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xl font-medium">
                      {Number.parseFloat(model.pricing.completion) === 0
                        ? "Free"
                        : `$${(Number.parseFloat(model.pricing.completion) * 1000000).toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Typical Chat Session (500K input / 500K output)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Input cost (500K tokens)</p>
                      <p className="font-medium">
                        {Number.parseFloat(model.pricing.prompt) === 0
                          ? "Free"
                          : `$${(Number.parseFloat(model.pricing.prompt) * 500000).toFixed(2)}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Output cost (500K tokens)</p>
                      <p className="font-medium">
                        {Number.parseFloat(model.pricing.completion) === 0
                          ? "Free"
                          : `$${(Number.parseFloat(model.pricing.completion) * 500000).toFixed(2)}`}
                      </p>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <p className="text-sm text-muted-foreground">Total cost</p>
                      <p className="font-medium">
                        {Number.parseFloat(model.pricing.prompt) === 0 &&
                        Number.parseFloat(model.pricing.completion) === 0
                          ? "Free"
                          : `$${(
                              Number.parseFloat(model.pricing.prompt) * 500000 +
                                Number.parseFloat(model.pricing.completion) * 500000
                            ).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration with AI SDK</CardTitle>
              <CardDescription>Use this model with the Vercel AI SDK and OpenRouter provider [^1]</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-secondary rounded-lg">
                  <h3 className="font-medium mb-2">Installation</h3>
                  <pre className="bg-black text-white p-4 rounded-md overflow-x-auto">
                    <code>npm install @openrouter/ai-sdk-provider ai</code>
                  </pre>
                </div>

                <div className="p-4 bg-secondary rounded-lg">
                  <h3 className="font-medium mb-2">Code Example</h3>
                  <pre className="bg-black text-white p-4 rounded-md overflow-x-auto">
                    <code>{generateCodeSample(model.id)}</code>
                  </pre>
                </div>

                <div className="flex items-center gap-2 p-4 border rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <p className="text-sm">
                    You'll need an OpenRouter API key to use this model. Get one from the{" "}
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      OpenRouter Dashboard
                    </a>
                    .
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Parameters</CardTitle>
              <CardDescription>Supported parameters for this model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {model.supported_parameters.map((param) => (
                    <div key={param} className="flex items-center gap-2 p-3 border rounded-lg">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="font-mono text-sm break-all">{param}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ExportConfigModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportConfig}
        modelContextLength={model.context_length}
      />
    </div>
  )
}
