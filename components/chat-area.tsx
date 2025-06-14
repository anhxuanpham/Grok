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
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setError(null)
    const controller = new AbortController()
    setAbortController(controller)

    const userMessage = { id: Date.now(), role: "user" as const, content: input }
    const updatedMessages = [...messages, userMessage]
    onUpdateMessages(updatedMessages)

    setInput("")
    setIsLoading(true)

    const assistantMessageId = Date.now() + 1
    const messagesWithAssistant = [...updatedMessages, { id: assistantMessageId, role: "assistant", content: "" }]
    onUpdateMessages(messagesWithAssistant)

    try {
      const apiMessages = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

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

      const reader = response.body?.getReader()
      if (!reader) throw new Error("Response body is null")

      let accumulatedContent = ""
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        buffer += chunk
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.trim() === "") continue

          if (line.startsWith("data: ")) {
            const data = line.slice(5).trim()
            if (data === "[DONE]") continue

            try {
              const parsedData = JSON.parse(data)
              if (parsedData.choices && parsedData.choices[0]?.delta?.content) {
                const contentDelta = parsedData.choices[0].delta.content
                accumulatedContent += contentDelta

                onUpdateMessages(
                  messagesWithAssistant.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, content: accumulatedContent } : msg,
                  ),
                )
              }
            } catch (err) {
              console.warn("Error parsing SSE data:", err, "Line:", line)
            }
          }
        }
      }

      if (buffer.trim() !== "") {
        if (buffer.startsWith("data: ")) {
          const data = buffer.slice(5).trim()
          if (data !== "[DONE]") {
            try {
              const parsedData = JSON.parse(data)
              if (parsedData.choices && parsedData.choices[0]?.delta?.content) {
                const contentDelta = parsedData.choices[0].delta.content
                accumulatedContent += contentDelta

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
        const errorMessage = err.message || "An unknown error occurred"
        setError(errorMessage)
        onUpdateMessages(updatedMessages)

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
      {/* Glass Header */}
      <header className="glass-strong border-b border-white/10 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="rounded-xl hover:glass-subtle transition-all duration-300 text-glass lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden sm:flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <Beaker className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-glass bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                xW
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ModelSelector onOpenSettings={() => setShowSettings(true)} />
            <Button
              onClick={handleNewChat}
              className="hidden sm:flex rounded-xl glass-subtle hover:glass-strong transition-all duration-300 text-glass border-0 shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              New Chat
            </Button>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
        style={{
          height: "calc(100vh - 180px)",
          overflowAnchor: "auto",
        }}
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl mx-auto w-fit">
                <Beaker className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-glass">Welcome to xW</h2>
              <p className="text-glass-muted">
                Start a conversation with our AI assistant. Ask questions, get help, or just chat!
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {error && (
          <div className="glass-strong border border-red-500/20 rounded-2xl p-4 sm:p-6 text-red-600 dark:text-red-400 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
                {(error.includes("API key") || error.includes("401")) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 rounded-xl border-red-500/20 hover:bg-red-500/10"
                    onClick={() => setShowSettings(true)}
                  >
                    Open Settings
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Glass Input Area */}
      <div className="p-4 sm:p-6 glass-strong border-t border-white/10 sticky bottom-0 z-10 shadow-2xl">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${selectedModel.name}...`}
            className="min-h-[60px] w-full resize-none glass-subtle border-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 rounded-2xl pr-14 text-glass placeholder:text-glass-muted shadow-lg"
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
              className="absolute right-3 top-3 h-10 w-10 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className={cn(
                "absolute right-3 top-3 h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300",
                (!input.trim() || isLoading) && "opacity-50 cursor-not-allowed",
              )}
              disabled={!input.trim() || isLoading}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          )}
        </form>
        <div className="mt-3 text-center text-xs text-glass-muted">
          xW may display inaccurate info. Please verify important information.
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="glass-strong rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-glass">API Key Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(false)}
                className="rounded-xl hover:bg-white/10 text-glass"
              >
                <StopCircle className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="glass-subtle border border-yellow-500/20 rounded-xl p-4 text-yellow-600 dark:text-yellow-400">
                <p className="font-semibold mb-2">API Key Error</p>
                <p className="text-sm">
                  There was an error with your API key. Please verify that you have the correct API key for{" "}
                  {selectedModel.provider.toUpperCase()}.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-glass capitalize">{selectedModel.provider} API Key</label>
                <input
                  type="password"
                  placeholder={`Enter your ${selectedModel.provider} API key`}
                  className="w-full glass-subtle border border-white/20 rounded-xl px-4 py-3 text-glass placeholder:text-glass-muted focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-xs text-glass-muted">
                  You can find your {selectedModel.provider === "openai" ? "OpenAI" : "XAI"} API key in your account
                  settings.
                </p>
              </div>

              <Button
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => setShowSettings(false)}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
