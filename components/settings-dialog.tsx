"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, X, Check, Info } from "lucide-react"
import { useSettings } from "@/contexts/settings-context"

export function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const { apiKeys, setApiKey, envVariables } = useSettings()
  const [showEnvNotification, setShowEnvNotification] = useState(false)

  // Check if any environment variables are available
  useEffect(() => {
    if (isOpen) {
      const hasEnvVars = Object.values(envVariables).some((value) => value === true)
      setShowEnvNotification(hasEnvVars)
    }
  }, [isOpen, envVariables])

  return (
    <>
      <Button
        variant="ghost"
        className="w-full justify-start gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800"
        onClick={() => setIsOpen(true)}
      >
        <Settings className="h-4 w-4" />
        Settings
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-zinc-900 rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Settings</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {showEnvNotification && (
              <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-md text-blue-300 text-sm mb-4 flex items-start">
                <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">API Keys Configured</p>
                  <p>The following API keys have been configured as environment variables:</p>
                  <ul className="list-disc list-inside mt-2">
                    {envVariables.XAI_API_KEY && <li>XAI API Key (for Grok models)</li>}
                    {envVariables.OPENAI_API_KEY && <li>OpenAI API Key (for GPT models)</li>}
                  </ul>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium">API Keys</h3>

              {/* XAI API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">XAI API Key</label>
                  {envVariables.XAI_API_KEY && (
                    <div className="flex items-center text-green-500 text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Configured in environment
                    </div>
                  )}
                </div>

                {envVariables.XAI_API_KEY ? (
                  <div className="bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-zinc-400">
                    API key is configured in environment variables
                  </div>
                ) : (
                  <Input
                    type="password"
                    value={apiKeys.xai || ""}
                    onChange={(e) => setApiKey("xai", e.target.value)}
                    placeholder="Enter your XAI API key"
                    className="bg-zinc-800 border-zinc-700"
                  />
                )}
                <p className="text-xs text-zinc-400 mt-1">Required for Grok models.</p>
              </div>

              {/* OpenAI API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">OpenAI API Key</label>
                  {envVariables.OPENAI_API_KEY && (
                    <div className="flex items-center text-green-500 text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Configured in environment
                    </div>
                  )}
                </div>

                {envVariables.OPENAI_API_KEY ? (
                  <div className="bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-zinc-400">
                    API key is configured in environment variables
                  </div>
                ) : (
                  <Input
                    type="password"
                    value={apiKeys.openai || ""}
                    onChange={(e) => setApiKey("openai", e.target.value)}
                    placeholder="Enter your OpenAI API key"
                    className="bg-zinc-800 border-zinc-700"
                  />
                )}
                <p className="text-xs text-zinc-400 mt-1">Required for GPT models.</p>
              </div>

              <div className="pt-4">
                <Button className="w-full" onClick={() => setIsOpen(false)}>
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
