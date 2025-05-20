import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatbotMessageProps {
  message: ChatMessage;
}

export function ChatbotMessage({ message }: ChatbotMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full gap-2 p-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
          <span className="text-xs font-semibold">AI</span>
        </Avatar>
      )}

      <div
        className={cn(
          "rounded-lg px-3 py-2 max-w-[80%] text-sm",
          isUser ? "bg-primary text-primary-foreground ml-12" : "bg-muted text-foreground mr-12",
        )}
      >
        {message.content}
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 bg-secondary text-secondary-foreground">
          <span className="text-xs font-semibold">You</span>
        </Avatar>
      )}
    </div>
  );
}
