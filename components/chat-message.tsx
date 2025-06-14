import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Beaker, Sparkles, User } from "lucide-react"
import { Markdown } from "./markdown"
import { useSettings } from "@/contexts/settings-context"

interface Message {
  id: number
  role: "user" | "assistant"
  content: string
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { selectedModel } = useSettings()
  const isUser = message.role === "user"

  const getAssistantIcon = () => {
    switch (selectedModel.icon) {
      case "Beaker":
        return <Beaker className="h-5 w-5" />
      case "Sparkles":
        return <Sparkles className="h-5 w-5" />
      default:
        return <Beaker className="h-5 w-5" />
    }
  }

  return (
    <div className="flex gap-4 sm:gap-6 group">
      <Avatar
        className={`h-10 w-10 sm:h-12 sm:w-12 shrink-0 shadow-lg ${
          isUser ? "glass-subtle border border-white/20" : "bg-gradient-to-br from-blue-500 to-indigo-600"
        }`}
      >
        <AvatarFallback className={`${isUser ? "text-glass bg-transparent" : "text-white bg-transparent"}`}>
          {isUser ? <User className="h-5 w-5" /> : getAssistantIcon()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2 min-w-0">
        <div className="font-semibold text-glass text-sm sm:text-base">{isUser ? "You" : selectedModel.name}</div>

        <div
          className={`rounded-2xl p-4 sm:p-6 shadow-lg transition-all duration-300 group-hover:shadow-xl ${
            isUser ? "glass-subtle border border-white/20 ml-0 sm:ml-8" : "glass-strong border border-white/10"
          }`}
        >
          {isUser ? (
            <div className="text-glass whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <Markdown content={message.content} />
          )}
        </div>
      </div>
    </div>
  )
}
