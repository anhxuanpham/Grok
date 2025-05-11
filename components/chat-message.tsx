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
    <div className="flex gap-4">
      <Avatar className={isUser ? "bg-zinc-700" : "bg-blue-900"}>
        <AvatarFallback>{isUser ? <User className="h-5 w-5" /> : getAssistantIcon()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="font-medium">{isUser ? "You" : selectedModel.name}</div>
        {isUser ? (
          <div className="text-zinc-300 whitespace-pre-wrap">{message.content}</div>
        ) : (
          <Markdown content={message.content} />
        )}
      </div>
    </div>
  )
}
