"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUp, Beaker, Menu, StopCircle, AlertTriangle } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { ModelSelector } from "./model-selector"
import { cn } from "@/lib/utils"
import { useSettings } from "@/contexts/settings-context"

interface Message {
  id: number
  role: "user" | "assistant"
  content: string
}

interface ChatAreaProps {
  toggleSidebar: () => void
  messages: Message[]
  onUpdateMessages: (messages: Message[]) => void
  onCreateNewChat: () => string
}

export function ChatArea({ toggleSidebar, messages, onUpdateMessages, onCreateNewChat }: ChatAreaProps) {
  const { selectedModel } = useSettings()
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use scrollIntoView with a slight delay to ensure smooth scrolling
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Reset any previous errors
    setError(null)

    // Create a new abort controller
    const controller = new AbortController()
    setAbortController(controller)

    // Add user message
    const userMessage = { id: Date.now(), role: "user" as const, content: input }
    const updatedMessages = [...messages, userMessage]
    onUpdateMessages(updatedMessages)

    // Clear input and set loading
    setInput("")
    setIsLoading(true)

    // Add empty assistant message that will be updated with streaming content
    const assistantMessageId = Date.now() + 1
    const messagesWithAssistant = [...updatedMessages, { id: assistantMessageId, role: "assistant", content: "" }]
    onUpdateMessages(messagesWithAssistant)

    try {
      // Prepare messages for API
      const apiMessages = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Make API request with the selected model
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          modelId: selectedModel.id,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      // Process the stream
      const reader = response.body?.getReader()
      if (!reader) throw new Error("Response body is null")

      let accumulatedContent = ""
      let buffer = "" // Buffer for incomplete chunks

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Decode the chunk
        const chunk = new TextDecoder().decode(value)

        // Append to buffer and process complete lines
        buffer += chunk
        const lines = buffer.split("\n")

        // Keep the last line in the buffer if it's not complete
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.trim() === "") continue

          if (line.startsWith("data: ")) {
            const data = line.slice(5).trim()

            // Check for [DONE] message
            if (data === "[DONE]") continue

            try {
              // Parse the JSON data
              const parsedData = JSON.parse(data)

              // Extract the content delta
              if (parsedData.choices && parsedData.choices[0]?.delta?.content) {
                const contentDelta = parsedData.choices[0].delta.content
                accumulatedContent += contentDelta

                // Update the assistant message with accumulated content
                onUpdateMessages(
                  messagesWithAssistant.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, content: accumulatedContent } : msg,
                  ),
                )
              }
            } catch (err) {
              console.warn("Error parsing SSE data:", err, "Line:", line)
              // Continue processing other lines even if one fails
            }
          }
        }
      }

      // Process any remaining data in the buffer
      if (buffer.trim() !== "") {
        if (buffer.startsWith("data: ")) {
          const data = buffer.slice(5).trim()
          if (data !== "[DONE]") {
            try {
              const parsedData = JSON.parse(data)
              if (parsedData.choices && parsedData.choices[0]?.delta?.content) {
                const contentDelta = parsedData.choices[0].delta.content
                accumulatedContent += contentDelta

                // Update the assistant message with accumulated content
                onUpdateMessages(
                  messagesWithAssistant.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, content: accumulatedContent } : msg,
                  ),
                )
              }
            } catch (err) {
              console.warn("Error parsing final SSE data:", err)
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Request was aborted")
      } else {
        console.error("Error fetching response:", err)

        // Check if the error is related to API keys
        const errorMessage = err.message || "An unknown error occurred"
        setError(errorMessage)

        // Remove the empty assistant message if there was an error
        onUpdateMessages(updatedMessages)

        // Show settings dialog if it's an API key error
        if (errorMessage.includes("API key") || errorMessage.includes("401")) {
          setShowSettings(true)
        }
      }
    } finally {
      setIsLoading(false)
      setAbortController(null)
    }
  }

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort()
      setIsLoading(false)
      setAbortController(null)
    }
  }

  const handleNewChat = () => {
    const newChatId = onCreateNewChat()
    setInput("")
    setError(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header to prevent jittering */}
      <header className="flex items-center justify-between p-4 border-b border-zinc-800 bg-black sticky top-0 z-10">
        <div className="flex items-center">
          {/* Make the menu button more prominent */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            className="mr-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-blue-400" />
            <span className="font-semibold">xW</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector onOpenSettings={() => setShowSettings(true)} />
          <Button
            variant="outline"
            size="sm"
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            onClick={handleNewChat}
          >
            New Chat
          </Button>
        </div>
      </header>

      {/* Chat messages container with fixed height and overflow */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 relative"
        style={{
          height: "calc(100vh - 140px)", // Fixed height: viewport height minus header and input area
          overflowAnchor: "auto", // Helps with scroll anchoring
        }}
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-md text-red-300 text-sm flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Error</p>
              <p>{error}</p>
              {(error.includes("API key") || error.includes("401")) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 bg-red-900/30 border-red-800 hover:bg-red-900/50"
                  onClick={() => setShowSettings(true)}
                >
                  Open Settings
                </Button>
              )}
            </div>
          </div>
        )}
        {/* This div acts as a scroll anchor */}
        <div ref={messagesEndRef} className="h-0.5" />
      </div>

      {/* Fixed input area at the bottom */}
      <div className="p-4 border-t border-zinc-800 bg-black sticky bottom-0 z-10">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${selectedModel.name}...`}
            className="min-h-[60px] w-full resize-none bg-zinc-900 border-zinc-700 focus-visible:ring-blue-400 pr-12"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            disabled={isLoading}
          />
          {isLoading ? (
            <Button
              type="button"
              size="icon"
              onClick={handleStopGeneration}
              className="absolute right-3 top-3 h-8 w-8 rounded-full bg-red-500 hover:bg-red-600"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className={cn(
                "absolute right-3 top-3 h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600",
                (!input.trim() || isLoading) && "opacity-50 cursor-not-allowed",
              )}
              disabled={!input.trim() || isLoading}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </form>
        <div className="mt-2 text-center text-xs text-zinc-500">
          xW may display inaccurate info, including about people, so double-check its responses.
        </div>
      </div>

      {/* Settings dialog */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-zinc-900 rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">API Key Settings</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                <StopCircle className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-md text-yellow-300 text-sm mb-4">
                <p className="font-medium mb-1">API Key Error</p>
                <p>
                  There was an error with your API key. Please verify that you have the correct API key for{" "}
                  {selectedModel.provider.toUpperCase()}.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium capitalize">{selectedModel.provider} API Key</label>
                <input
                  type="password"
                  placeholder={`Enter your ${selectedModel.provider} API key`}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  You can find your {selectedModel.provider === "openai" ? "OpenAI" : "XAI"} API key in your account
                  settings.
                </p>
              </div>

              <div className="pt-4">
                <Button className="w-full" onClick={() => setShowSettings(false)}>
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
