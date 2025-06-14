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

  if (!isOpen) {
    return null
  }

  return (
    <div className="h-full w-full sm:w-[320px] flex flex-col glass-strong rounded-r-2xl sm:rounded-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <Beaker className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-glass bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            xW
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="rounded-xl hover:bg-white/10 text-glass"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-4 sm:p-6">
        <Button
          onClick={onCreateChat}
          className="w-full justify-start gap-3 h-12 rounded-xl glass-subtle hover:glass-strong transition-all duration-300 text-glass border-0 shadow-lg hover:shadow-xl hover:scale-[1.02]"
        >
          <MessageSquarePlus className="h-5 w-5" />
          <span className="font-medium">New chat</span>
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 px-4 sm:px-6">
        <div className="space-y-6">
          {chatGroups.today.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-glass-muted uppercase tracking-wider mb-3">Today</div>
              <div className="space-y-2">
                {chatGroups.today.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === activeChat}
                    onSelect={() => onSelectChat(chat.id)}
                    onDelete={() => onDeleteChat(chat.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {chatGroups.yesterday.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-glass-muted uppercase tracking-wider mb-3">Yesterday</div>
              <div className="space-y-2">
                {chatGroups.yesterday.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === activeChat}
                    onSelect={() => onSelectChat(chat.id)}
                    onDelete={() => onDeleteChat(chat.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {chatGroups.older.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-glass-muted uppercase tracking-wider mb-3">Older</div>
              <div className="space-y-2">
                {chatGroups.older.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === activeChat}
                    onSelect={() => onSelectChat(chat.id)}
                    onDelete={() => onDeleteChat(chat.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Settings */}
      <div className="p-4 sm:p-6 border-t border-white/10">
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
        "group flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-all duration-300 hover:scale-[1.02]",
        isActive ? "glass-strong shadow-lg text-glass" : "hover:glass-subtle text-glass-muted hover:text-glass",
      )}
    >
      <Button
        variant="ghost"
        className="flex-1 justify-start text-left font-medium truncate h-auto p-0 hover:bg-transparent"
        onClick={onSelect}
      >
        <MessageSquarePlus className="h-4 w-4 mr-3 shrink-0" />
        <span className="truncate">{chat.title}</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500/20 hover:text-red-500"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
