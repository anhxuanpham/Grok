export interface ModelConfig {
  id: string
  name: string
  provider: "xai" | "openai" | "custom"
  apiEndpoint: string
  requestFormat: "openai" | "custom"
  modelId: string
  maxTokens?: number
  temperature?: number
  icon?: string
}

export const availableModels: ModelConfig[] = [
  {
    id: "grok-3-beta",
    name: "Grok-3 Beta",
    provider: "xai",
    apiEndpoint: "https://api.yescale.io/v1/chat/completions",
    requestFormat: "openai",
    modelId: "grok-3-beta",
    maxTokens: 2000,
    temperature: 0.7,
    icon: "Beaker",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    apiEndpoint: "https://api.yescale.io/v1/chat/completions",// Using official OpenAI endpoint
    requestFormat: "openai",
    modelId: "gpt-4o",
    maxTokens: 4000,
    temperature: 0.7,
    icon: "Sparkles",
  },
]

export const defaultModel = availableModels[0]
