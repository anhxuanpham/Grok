"use client"

import { useState, useEffect } from "react"
import { Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/contexts/settings-context"

export function EnvNotification() {
  const [isVisible, setIsVisible] = useState(false)
  const { envVariables } = useSettings()

  useEffect(() => {
    // Check if any environment variables are available
    const hasEnvVars = Object.values(envVariables).some((value) => value === true)

    if (hasEnvVars) {
      // Show notification if environment variables are available
      setIsVisible(true)

      // Hide after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [envVariables])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-blue-900/90 border border-blue-800 rounded-md p-4 text-white shadow-lg z-50 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-start">
        <Info className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium mb-1">API Keys Configured</h3>
          <p className="text-sm mb-2">The following API keys have been detected:</p>
          <ul className="list-disc list-inside text-sm mb-2">
            {envVariables.XAI_API_KEY && <li>XAI API Key (for Grok models)</li>}
            {envVariables.OPENAI_API_KEY && <li>OpenAI API Key (for GPT models)</li>}
          </ul>
          <p className="text-sm">
            You can now use {envVariables.XAI_API_KEY && "Grok"}
            {envVariables.XAI_API_KEY && envVariables.OPENAI_API_KEY && " and "}
            {envVariables.OPENAI_API_KEY && "GPT"} models with xW.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mt-1 -mr-1 text-blue-300 hover:text-white hover:bg-blue-800/50"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
