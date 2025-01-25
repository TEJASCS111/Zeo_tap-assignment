import React, { useState, useRef, useEffect } from 'react';
import { Message, CDP } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { CDPSelector } from './components/CDPSelector';
import { Bot } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedCDP, setSelectedCDP] = useState<CDP | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate bot typing
    setIsTyping(true);
    
    // Simulate bot response after a delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I understand you're asking about ${selectedCDP}. This is a demo response. In a real implementation, this would process your question: "${content}" and provide relevant documentation from ${selectedCDP}'s docs.`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">CDP Assistant</h1>
            <p className="text-sm text-gray-500">Ask me anything about CDP documentation</p>
          </div>
        </div>
      </header>

      <CDPSelector selectedCDP={selectedCDP} onSelect={setSelectedCDP} />

      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="mb-2">👋 Select a CDP and start asking questions!</p>
              <p className="text-sm">Example: "How do I set up a new source?"</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && (
              <div className="p-4 text-gray-500">CDP Assistant is typing...</div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto w-full">
        <ChatInput 
          onSend={handleSend} 
          disabled={!selectedCDP || isTyping} 
        />
      </footer>
    </div>
  );
}

export default App;