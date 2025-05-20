"use client";

import React, { useState } from "react";
import { ChatbotButton } from "./chatbot-button";
import { ChatbotWindow } from "./chatbot-window";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChatbot = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      <ChatbotButton
        isOpen={isOpen}
        onClick={toggleChatbot}
      />
      <ChatbotWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
