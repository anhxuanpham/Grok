"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { type ModelConfig, availableModels, defaultModel } from "@/config/models"

interface SettingsContextType {
  selectedModel: ModelConfig
  setSelectedModel: (model: ModelConfig) => void
  apiKeys: Record<string, string>
  setApiKey: (provider: string, key: string) => void
  envVariables: Record<string, boolean>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(defaultModel)
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [envVariables, setEnvVariables] = useState<Record<string, boolean>>({})

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("xw-settings")
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)

        // Load selected model
        if (parsedSettings.selectedModelId) {
          const model = availableModels.find((m) => m.id === parsedSettings.selectedModelId)
          if (model) {
            setSelectedModel(model)
          }
        }

        // Load API keys
        if (parsedSettings.apiKeys) {
          setApiKeys(parsedSettings.apiKeys)
        }
      } catch (error) {
        console.error("Error parsing saved settings:", error)
      }
    }

    // Check which environment variables are available
    fetch("/api/check-env")
      .then((response) => response.json())
      .then((data) => {
        setEnvVariables(data)
      })
      .catch((error) => {
        console.error("Error checking environment variables:", error)
      })
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    const settingsToSave = {
      selectedModelId: selectedModel.id,
      apiKeys,
    }
    localStorage.setItem("xw-settings", JSON.stringify(settingsToSave))
  }, [selectedModel, apiKeys])

  const setApiKey = (provider: string, key: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: key,
    }))
  }

  return (
    <SettingsContext.Provider value={{ selectedModel, setSelectedModel, apiKeys, setApiKey, envVariables }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
