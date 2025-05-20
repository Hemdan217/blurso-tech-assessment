import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatbotButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export function ChatbotButton({ isOpen, onClick, className }: ChatbotButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        "fixed bottom-4 right-4 z-50 rounded-full h-14 w-14 shadow-xl flex items-center justify-center transition-all",
        isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90",
        className,
      )}
      aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
    >
      <MessageSquare className="h-6 w-6" />
    </Button>
  );
}
