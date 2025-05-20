import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send } from "lucide-react";
import { ChatbotMessage, ChatMessage } from "./chatbot-message";
import { cn } from "@/lib/utils";

interface ChatbotWindowProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function ChatbotWindow({ isOpen, onClose, className }: ChatbotWindowProps) {
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "👋 Hi there! I'm your Blurr HR assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sample FAQs to simulate responses
  const faqs = [
    {
      question: "How do I create a new task?",
      answer:
        "To create a new task, go to your project page and click the 'New Task' button. Fill in the task details and click 'Create'.",
    },
    {
      question: "How do I change my password?",
      answer:
        "You can change your password by going to your profile settings. Click on your profile icon in the top right, select 'Settings', and then 'Change Password'.",
    },
    {
      question: "What's the difference between admin and employee roles?",
      answer:
        "Admins can manage all employees, projects, and tasks. They have access to salary information and can create new users. Employees can only see their assigned tasks and projects.",
    },
    {
      question: "How do I update a task's status?",
      answer:
        "You can update a task's status by dragging it to a different column on the Kanban board, or by opening the task details and changing the status dropdown.",
    },
    {
      question: "How can I see my salary information?",
      answer:
        "You can view your salary information by navigating to 'My Salaries' in the dashboard sidebar. This shows your basic salary and any adjustments.",
    },
  ];

  // Function to handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate AI response after a delay
    setTimeout(() => {
      // Find a matching FAQ or use default response
      const matchingFaq = faqs.find(
        (faq) =>
          input.toLowerCase().includes(faq.question.toLowerCase().split(" ")[1]) ||
          input.toLowerCase().includes(faq.question.toLowerCase().split(" ")[2]),
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: matchingFaq
          ? matchingFaq.answer
          : "I don't have specific information about that yet. As this is a demo, I can only answer basic questions about tasks, projects, and user roles.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <Card
      className={cn(
        "fixed bottom-20 right-4 z-50 w-[350px] shadow-xl transition-all duration-300 ease-in-out",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
        className,
      )}
    >
      <CardHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            Blurr HR Assistant
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="Close chatbot"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <ScrollArea className="h-[350px]">
        <CardContent className="p-3">
          {messages.map((message) => (
            <ChatbotMessage
              key={message.id}
              message={message}
            />
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
      </ScrollArea>

      <CardFooter className="p-3 border-t">
        <form
          onSubmit={handleSendMessage}
          className="flex w-full gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
