"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown, Beaker, Sparkles, AlertCircle, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { availableModels } from "@/config/models"
import { useSettings } from "@/contexts/settings-context"

interface ModelSelectorProps {
  onOpenSettings?: () => void
}

export function ModelSelector({ onOpenSettings }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const { selectedModel, setSelectedModel, envVariables } = useSettings()

  const getIconComponent = (iconName: string | undefined) => {
    switch (iconName) {
      case "Beaker":
        return <Beaker className="h-4 w-4 mr-2" />
      case "Sparkles":
        return <Sparkles className="h-4 w-4 mr-2" />
      default:
        return <Beaker className="h-4 w-4 mr-2" />
    }
  }

  // Check if a model is available based on environment variables
  const isModelAvailable = (model: (typeof availableModels)[0]) => {
    if (model.provider === "xai") {
      return envVariables.XAI_API_KEY === true
    } else if (model.provider === "openai") {
      return envVariables.OPENAI_API_KEY === true
    }
    return false
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
      >
        {getIconComponent(selectedModel.icon)}
        {selectedModel.name}
        <ChevronDown className="h-4 w-4 ml-1" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-zinc-800 border border-zinc-700 z-50">
            <div className="py-1">
              {availableModels.map((model) => {
                const available = isModelAvailable(model)

                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      if (available) {
                        setSelectedModel(model)
                        setOpen(false)
                      } else if (onOpenSettings) {
                        onOpenSettings()
                        setOpen(false)
                      }
                    }}
                    className={cn(
                      "flex items-center w-full px-4 py-2 text-sm text-left",
                      selectedModel.id === model.id ? "bg-zinc-700" : "",
                      available ? "hover:bg-zinc-700" : "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {getIconComponent(model.icon)}
                    <span className="flex-1">{model.name}</span>
                    {!available && <AlertCircle className="h-4 w-4 text-yellow-500 ml-1" />}
                    {selectedModel.id === model.id && <Check className="h-4 w-4" />}
                  </button>
                )
              })}

              <div className="border-t border-zinc-700 mt-1 pt-1">
                <button
                  onClick={() => {
                    if (onOpenSettings) {
                      onOpenSettings()
                    }
                    setOpen(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-zinc-700"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="flex-1">API Settings</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
