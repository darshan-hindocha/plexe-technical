"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { ChatWebSocketClient, ChatMessage, ConnectionState } from "./websocket";
import analytics from "./client-analytics";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
}

interface ChatContextType {
  messages: Message[];
  inputMessage: string;
  setInputMessage: (message: string) => void;
  isTyping: boolean;
  connectionState: ConnectionState;
  sendMessage: () => Promise<void>;
  isConnected: () => boolean;
  onModelUploadRequested?: () => void;
  setInitialMessage: (message: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
  onModelUploadRequested?: () => void;
}

export function ChatProvider({ children, onModelUploadRequested }: ChatProviderProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    reconnectAttempt: 0
  });
  
  const wsClient = useRef<ChatWebSocketClient | null>(null);
  const isInitialized = useRef(false);
  const onModelUploadRequestedRef = useRef(onModelUploadRequested);

  // Get or create persistent client ID
  const getClientId = useCallback((): string => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('plexe_chat_client_id') : null;
    if (stored) {
      return stored;
    }
    const newId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('plexe_chat_client_id', newId);
    }
    return newId;
  }, []);

  const handleWebSocketMessage = useCallback((message: ChatMessage) => {
    const clientId = getClientId();
    
    switch (message.type) {
      case 'welcome':
        // Analytics: Track chat session start on first welcome message
        analytics.chatSessionStarted(clientId);
        break;
        
      case 'message':
        if (message.content) {
          const assistantMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: message.content,
            timestamp: new Date(message.timestamp),
            status: "sent"
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsTyping(false);
          
          // Analytics: Track message received
          analytics.chatMessageReceived(message.content.length, clientId);
          
          // Handle special actions (check for upload requests)
          if (message.content.toLowerCase().includes('upload') && 
              message.content.toLowerCase().includes('interface') &&
              onModelUploadRequestedRef.current) {
            setTimeout(() => onModelUploadRequestedRef.current?.(), 1000);
          }
        }
        break;
      
      case 'typing':
        setIsTyping(true);
        break;
      
      case 'error':
        setIsTyping(false);
        if (message.content) {
          const errorMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: `Error: ${message.content}`,
            timestamp: new Date(message.timestamp),
            status: "error"
          };
          setMessages(prev => [...prev, errorMessage]);
          
          // Analytics: Track chat error
          analytics.chatMessageError(message.content, clientId);
        }
        break;
      
      case 'pong':
        // Handle pong response if needed
        console.log('Received pong');
        break;
    }
  }, []);

  // Update the ref when onModelUploadRequested changes
  useEffect(() => {
    onModelUploadRequestedRef.current = onModelUploadRequested;
  }, [onModelUploadRequested]);

  // Initialize WebSocket connection once
  useEffect(() => {
    if (isInitialized.current) return;
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin.replace(/^http/, 'ws')
      : 'ws://localhost:8000';
    
    const clientId = getClientId();
    wsClient.current = new ChatWebSocketClient(baseUrl, clientId);

    // Set up message handler
    const unsubscribeMessage = wsClient.current.onMessage(handleWebSocketMessage);

    // Set up connection state handler
    const unsubscribeConnection = wsClient.current.onConnectionChange((state: ConnectionState) => {
      setConnectionState(state);
    });

    // Connect
    wsClient.current.connect();

    isInitialized.current = true;

    // Cleanup only on page unload, not component unmount
    const handleBeforeUnload = () => {
      if (wsClient.current) {
        wsClient.current.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubscribeMessage();
      unsubscribeConnection();
    };
  }, [getClientId]);

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !wsClient.current || !wsClient.current.isConnected()) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
      status: "sending"
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputMessage;
    setInputMessage("");

    // Analytics: Track message sent
    const clientId = getClientId();
    analytics.chatMessageSent(messageContent.length, clientId);

    try {
      // Send via WebSocket
      wsClient.current.sendMessage(messageContent);
      
      // Update message status to sent
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: "sent" as const }
            : msg
        )
      );
    } catch (error) {
      // Update message status to error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: "error" as const }
            : msg
        )
      );
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I couldn't send your message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
        status: "error"
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [inputMessage]);

  const isConnected = useCallback(() => {
    return wsClient.current?.isConnected() ?? false;
  }, []);

  const setInitialMessage = useCallback((message: string) => {
    setInputMessage(message);
  }, []);

  const value: ChatContextType = {
    messages,
    inputMessage,
    setInputMessage,
    isTyping,
    connectionState,
    sendMessage,
    isConnected,
    onModelUploadRequested,
    setInitialMessage
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
} 