"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Beaker, MessageSquarePlus, Trash2, X } from "lucide-react"
import { SettingsDialog } from "./settings-dialog"

interface Chat {
  id: string
  title: string
  createdAt: Date
}

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  chats: Chat[]
  activeChat: string | null
  onSelectChat: (chatId: string) => void
  onCreateChat: () => string
  onDeleteChat: (chatId: string) => void
}

export function Sidebar({
  isOpen,
  setIsOpen,
  chats,
  activeChat,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
}: SidebarProps) {
  // Group chats by date
  const today = new Date().setHours(0, 0, 0, 0)
  const yesterday = new Date(today - 86400000).setHours(0, 0, 0, 0)

  const chatGroups = {
    today: chats.filter((chat) => new Date(chat.createdAt).setHours(0, 0, 0, 0) === today),
    yesterday: chats.filter((chat) => new Date(chat.createdAt).setHours(0, 0, 0, 0) === yesterday),
    older: chats.filter((chat) => new Date(chat.createdAt).setHours(0, 0, 0, 0) < yesterday),
  }

  // If the sidebar is not open, we don't need to render its contents
  if (!isOpen) {
    return null
  }

  return (
    <div className="h-full w-[280px] flex flex-col bg-zinc-900">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Beaker className="h-5 w-5 text-blue-400" />
          <span className="font-semibold">xW</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-4 py-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          onClick={onCreateChat}
        >
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4 py-2">
        {chatGroups.today.length > 0 && (
          <>
            <div className="text-xs font-medium text-zinc-500 py-2">Today</div>
            {chatGroups.today.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChat}
                onSelect={() => onSelectChat(chat.id)}
                onDelete={() => onDeleteChat(chat.id)}
              />
            ))}
          </>
        )}

        {chatGroups.yesterday.length > 0 && (
          <>
            <div className="text-xs font-medium text-zinc-500 py-2 mt-2">Yesterday</div>
            {chatGroups.yesterday.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChat}
                onSelect={() => onSelectChat(chat.id)}
                onDelete={() => onDeleteChat(chat.id)}
              />
            ))}
          </>
        )}

        {chatGroups.older.length > 0 && (
          <>
            <div className="text-xs font-medium text-zinc-500 py-2 mt-2">Older</div>
            {chatGroups.older.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChat}
                onSelect={() => onSelectChat(chat.id)}
                onDelete={() => onDeleteChat(chat.id)}
              />
            ))}
          </>
        )}
      </ScrollArea>

      <div className="mt-auto p-4 border-t border-zinc-800">
        <SettingsDialog />
      </div>
    </div>
  )
}

interface ChatItemProps {
  chat: Chat
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}

function ChatItem({ chat, isActive, onSelect, onDelete }: ChatItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer",
        isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800",
      )}
    >
      <Button
        variant="ghost"
        className="flex-1 justify-start text-left font-normal truncate h-auto p-0 hover:bg-transparent"
        onClick={onSelect}
      >
        <MessageSquarePlus className="h-4 w-4 mr-2 shrink-0" />
        <span className="truncate">{chat.title}</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 className="h-4 w-4 text-zinc-500 hover:text-red-400" />
      </Button>
    </div>
  )
}
