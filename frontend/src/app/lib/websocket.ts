/**
 * WebSocket client for real-time chat communication.
 * 
 * Provides reconnection, message queuing, and connection state management.
 */

import analytics from './client-analytics';

export interface ChatMessage {
  type: 'chat' | 'welcome' | 'message' | 'typing' | 'error' | 'ping' | 'pong';
  content?: string;
  context?: any[];
  timestamp: string;
}

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnectAttempt: number;
  error?: string;
}

export type MessageHandler = (message: ChatMessage) => void;
export type ConnectionHandler = (state: ConnectionState) => void;

export class ChatWebSocketClient {
  private ws: WebSocket | null = null;
  private messageQueue: ChatMessage[] = [];
  private messageHandlers: MessageHandler[] = [];
  private connectionHandlers: ConnectionHandler[] = [];
  private clientId: string;
  private baseUrl: string;
  private connectionState: ConnectionState = {
    status: 'disconnected',
    reconnectAttempt: 0
  };
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private maxRetries: number = 10;
  private maxReconnectionDelay: number = 30000;
  private minReconnectionDelay: number = 1000;
  private reconnectionDelayGrowFactor: number = 1.3;

  constructor(baseUrl: string = 'ws://localhost:8000', clientId?: string) {
    this.baseUrl = baseUrl.replace(/^http/, 'ws');
    this.clientId = clientId || this.generateClientId();
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateConnectionState(updates: Partial<ConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates };
    this.connectionHandlers.forEach(handler => handler(this.connectionState));
  }

  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.updateConnectionState({ 
        status: 'connected', 
        reconnectAttempt: 0,
        error: undefined
      });
      this.flushMessageQueue();
      
      // Analytics: Track WebSocket connection
      analytics.websocketConnected(this.clientId);
    };

    this.ws.onmessage = (event) => {
      try {
        const message: ChatMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      this.updateConnectionState({ 
        status: 'disconnected',
        error: event.reason || 'Connection closed'
      });
      
      // Analytics: Track WebSocket disconnection
      analytics.websocketDisconnected(this.clientId, event.reason);
      
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateConnectionState({ 
        status: 'error',
        error: 'Connection error occurred'
      });
      
      // Analytics: Track WebSocket error
      analytics.websocketError(this.clientId, 'Connection error occurred');
    };
  }

  private scheduleReconnect() {
    if (this.connectionState.reconnectAttempt >= this.maxRetries) {
      console.log('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      this.minReconnectionDelay * Math.pow(this.reconnectionDelayGrowFactor, this.connectionState.reconnectAttempt),
      this.maxReconnectionDelay
    );

    this.reconnectTimeout = setTimeout(() => {
      const newAttempt = this.connectionState.reconnectAttempt + 1;
      this.updateConnectionState({ 
        reconnectAttempt: newAttempt 
      });
      
      // Analytics: Track reconnection attempt
      analytics.websocketReconnect(this.clientId, newAttempt);
      
      this.connect();
    }, delay);
  }

  private handleMessage(message: ChatMessage) {
    this.messageHandlers.forEach(handler => handler(message));
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessageNow(message);
      }
    }
  }

  private sendMessageNow(message: ChatMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  public connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.updateConnectionState({ status: 'connecting' });

    const wsUrl = `${this.baseUrl}/api/v1/ws/chat/${this.clientId}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.updateConnectionState({ 
        status: 'error',
        error: 'Failed to create connection'
      });
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateConnectionState({ status: 'disconnected' });
  }

  public sendMessage(content: string, context?: any[]): void {
    const message: ChatMessage = {
      type: 'chat',
      content,
      context,
      timestamp: new Date().toISOString()
    };

    if (this.isConnected()) {
      this.sendMessageNow(message);
    } else {
      this.messageQueue.push(message);
      // Auto-connect if not connected
      if (this.connectionState.status === 'disconnected') {
        this.connect();
      }
    }
  }

  public ping(): void {
    const message: ChatMessage = {
      type: 'ping',
      timestamp: new Date().toISOString()
    };

    if (this.isConnected()) {
      this.sendMessageNow(message);
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    // Return unsubscribe function
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  public onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.push(handler);
    // Return unsubscribe function
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  public getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }

  public clearMessageQueue(): void {
    this.messageQueue = [];
  }
} 