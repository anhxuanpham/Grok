"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MessageSquare } from "lucide-react"

export function ChatHistory() {
  const chatHistory = [
    { id: 1, title: "How to build a website", active: true },
    { id: 2, title: "Explain quantum computing" },
    { id: 3, title: "Best practices for React" },
    { id: 4, title: "Machine learning basics" },
    { id: 5, title: "JavaScript vs TypeScript" },
  ]

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-zinc-500 py-2">Today</div>
      {chatHistory.map((chat) => (
        <Button
          key={chat.id}
          variant="ghost"
          className={cn(
            "w-full justify-start text-left font-normal truncate h-auto py-2",
            chat.active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800",
          )}
        >
          <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
          <span className="truncate">{chat.title}</span>
        </Button>
      ))}
    </div>
  )
}
