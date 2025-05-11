"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { ChatArea } from "./chat-area"
import { EnvNotification } from "./env-notification"
import { cn } from "@/lib/utils"

interface Message {
  id: number
  role: "user" | "assistant"
  content: string
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

export function GrokInterface() {
  // Set sidebar closed by default
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  // Load chats from localStorage on component mount
  useEffect(() => {
    const savedChats = localStorage.getItem("xw-chats")
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats)
        setChats(
          parsedChats.map((chat: any) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
          })),
        )

        // Set active chat to the most recent one
        if (parsedChats.length > 0 && !activeChat) {
          setActiveChat(parsedChats[0].id)
        }
      } catch (error) {
        console.error("Error parsing saved chats:", error)
      }
    } else {
      // Create a new chat if none exist
      createNewChat()
    }
  }, [])

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("xw-chats", JSON.stringify(chats))
    }
  }, [chats])

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [
        {
          id: 1,
          role: "assistant",
          content: "Hello! I'm xW, an AI assistant. How can I help you today?",
        },
      ],
      createdAt: new Date(),
    }

    setChats((prev) => [newChat, ...prev])
    setActiveChat(newChat.id)
    return newChat.id
  }

  const updateChatTitle = (chatId: string, title: string) => {
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, title } : chat)))
  }

  const updateChatMessages = (chatId: string, messages: Message[]) => {
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, messages } : chat)))
  }

  const deleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId))

    // If the deleted chat was active, set the first available chat as active
    if (activeChat === chatId) {
      const remainingChats = chats.filter((chat) => chat.id !== chatId)
      if (remainingChats.length > 0) {
        setActiveChat(remainingChats[0].id)
      } else {
        // Create a new chat if all chats were deleted
        createNewChat()
      }
    }
  }

  const activeMessages = chats.find((chat) => chat.id === activeChat)?.messages || []

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Fixed sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          chats={chats}
          activeChat={activeChat}
          onSelectChat={setActiveChat}
          onCreateChat={createNewChat}
          onDeleteChat={deleteChat}
        />
      </div>

      {/* Main content area with fixed positioning - takes full width when sidebar is closed */}
      <main
        className={cn(
          "fixed inset-y-0 right-0 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "left-[280px]" : "left-0",
        )}
      >
        <ChatArea
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          messages={activeMessages}
          onUpdateMessages={(messages) => {
            if (activeChat) {
              updateChatMessages(activeChat, messages)

              // Update chat title based on first user message if title is still "New Chat"
              const chat = chats.find((c) => c.id === activeChat)
              if (chat && chat.title === "New Chat") {
                const firstUserMessage = messages.find((m) => m.role === "user")
                if (firstUserMessage) {
                  const title =
                    firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? "..." : "")
                  updateChatTitle(activeChat, title)
                }
              }
            }
          }}
          onCreateNewChat={createNewChat}
        />
      </main>

      {/* Environment variables notification */}
      <EnvNotification />
    </div>
  )
}
