"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { useChatContext, Message } from "../lib/chat-context";

export default function Chat() {
  const {
    messages,
    inputMessage,
    setInputMessage,
    isTyping,
    connectionState,
    sendMessage,
    isConnected
  } = useChatContext();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !isConnected()) {
      return;
    }
    await sendMessage();
  }, [inputMessage, isConnected, sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const formatMessage = useCallback((content: string) => {
    // Split content by lines first
    const lines = content.split("\n");
    
    return lines.map((line, lineIndex) => {
      // Parse markdown bold syntax (**text**)
      const parts = line.split(/(\*\*.*?\*\*)/g);
      
      const formattedLine = parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // Remove the ** markers and apply bold formatting
          const boldText = part.slice(2, -2);
          return (
            <strong key={`${lineIndex}-${partIndex}`} className="font-semibold">
              {boldText}
            </strong>
          );
        }
        return part;
      });
      
      return (
        <React.Fragment key={lineIndex}>
          {formattedLine}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  }, []);

  const getConnectionIcon = () => {
    switch (connectionState.status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-600" />;
    }
  };

  const getConnectionStatus = () => {
    switch (connectionState.status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return `Error: ${connectionState.error}`;
      default:
        return 'Disconnected';
    }
  };

  const getMessageStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Loader2 className="h-3 w-3 animate-spin opacity-50" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">ML Assistant</h2>
              <p className="text-sm text-gray-500">
                Model management and predictions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <span className="text-xs text-gray-500">{getConnectionStatus()}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              } ${message.status === 'error' ? 'border-2 border-red-300' : ''}`}
            >
              <div className="flex items-start space-x-2">
                {message.role === "assistant" && (
                  <Bot className="h-4 w-4 mt-0.5 text-blue-600" />
                )}
                {message.role === "user" && (
                  <User className="h-4 w-4 mt-0.5 text-white" />
                )}
                <div className="flex-1">
                  <div className="text-sm">
                    {formatMessage(message.content)}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {message.role === "user" && getMessageStatusIcon(message.status)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-800">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 text-blue-600" />
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about models, upload files, or make predictions..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
            disabled={connectionState.status !== 'connected'}
          />
          <button
            onClick={handleSendMessage}
            disabled={connectionState.status !== 'connected' || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
