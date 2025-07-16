'use client';

// Event names enum for consistency (following PostHog rules)
export const ANALYTICS_EVENTS = {
  // Model Management Events
  MODEL_UPLOAD_STARTED: 'model_upload_started',
  MODEL_UPLOAD_SUCCESS: 'model_upload_success',
  MODEL_UPLOAD_ERROR: 'model_upload_error',
  MODEL_DELETED: 'model_deleted',
  MODEL_SELECTED: 'model_selected',
  MODEL_LIST_VIEWED: 'model_list_viewed',
  
  // Chat Events
  CHAT_SESSION_STARTED: 'chat_session_started',
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_MESSAGE_RECEIVED: 'chat_message_received',
  CHAT_MESSAGE_ERROR: 'chat_message_error',
  
  // Navigation Events
  VIEW_CHANGED: 'view_changed',
  
  // Connection Events
  WEBSOCKET_CONNECTED: 'websocket_connected',
  WEBSOCKET_DISCONNECTED: 'websocket_disconnected',
  WEBSOCKET_ERROR: 'websocket_error',
  WEBSOCKET_RECONNECT: 'websocket_reconnect',
} as const;

// Custom properties enum for consistency
export const ANALYTICS_PROPERTIES = {
  MODEL_ID: 'model_id',
  MODEL_NAME: 'model_name',
  MODEL_TYPE: 'model_type',
  MODEL_SIZE: 'model_size',
  FILE_NAME: 'file_name',
  FILE_SIZE: 'file_size',
  ERROR_MESSAGE: 'error_message',
  MESSAGE_LENGTH: 'message_length',
  VIEW_NAME: 'view_name',
  PREVIOUS_VIEW: 'previous_view',
  CONNECTION_ATTEMPT: 'connection_attempt',
  CLIENT_ID: 'client_id',
  FEATURE_COUNT: 'feature_count',
} as const;

type EventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];
type PropertyName = typeof ANALYTICS_PROPERTIES[keyof typeof ANALYTICS_PROPERTIES];

// Global PostHog instance - will be initialized once
let posthogInstance: any = null;
let isPostHogBlocked = false;
const fallbackEvents: Array<{event: string, properties: any, timestamp: number}> = [];

// Fallback analytics when PostHog is blocked
function initializeFallbackAnalytics() {
  console.log('🔄 Fallback Analytics: Initialized - events will be logged to console');
  
  // Try to send events directly to PostHog API as fallback
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (apiKey) {
    console.log('🔄 Fallback Analytics: Will attempt direct API calls to PostHog');
  }
}

// Send event directly to PostHog API when script is blocked
async function sendEventDirectly(event: string, properties: any) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;

  try {
    const eventData = {
      api_key: apiKey,
      event: event,
      properties: {
        ...properties,
        $lib: 'web-fallback',
        $lib_version: '1.0.0',
        distinct_id: getOrCreateDistinctId(),
        timestamp: new Date().toISOString(),
      }
    };

    console.log('📤 Fallback Analytics: Sending event directly to API:', event, properties);

    const response = await fetch('/ingest/capture/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });

    if (response.ok) {
      console.log('✅ Fallback Analytics: Event sent successfully:', event);
    } else {
      console.error('❌ Fallback Analytics: Failed to send event:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Fallback Analytics: Error sending event:', error);
    // Store in fallback array for potential retry
    fallbackEvents.push({
      event,
      properties,
      timestamp: Date.now()
    });
  }
}

// Get or create a distinct ID for the user
function getOrCreateDistinctId(): string {
  if (typeof window === 'undefined') return 'server-side';
  
  let distinctId = localStorage.getItem('posthog_distinct_id');
  if (!distinctId) {
    distinctId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('posthog_distinct_id', distinctId);
  }
  return distinctId;
}
let isInitialized = false;
let isInitializing = false;

// Initialize PostHog only on client side
const initializePostHog = async (): Promise<any> => {
  // Only run in browser
  if (typeof window === 'undefined') {
    console.log('⚠️ PostHog: Skipping initialization (server-side)');
    return null;
  }

  // Return existing instance if already initialized
  if (posthogInstance) {
    console.log('✅ PostHog: Using existing instance');
    return posthogInstance;
  }

  // Prevent multiple initialization attempts
  if (isInitializing) {
    console.log('⏳ PostHog: Waiting for existing initialization...');
    // Wait for existing initialization to complete
    return new Promise((resolve) => {
      const checkInit = () => {
        if (isInitialized) {
          resolve(posthogInstance);
        } else {
          setTimeout(checkInit, 100);
        }
      };
      checkInit();
    });
  }

  isInitializing = true;
  console.log('🚀 PostHog: Starting initialization...');

  try {
    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!apiKey) {
      console.error('❌ PostHog: NEXT_PUBLIC_POSTHOG_KEY not found!');
      return null;
    }
    console.log('🔑 PostHog: API key found:', apiKey.substring(0, 8) + '...');

    // Load PostHog script dynamically
    if (!window.posthog) {
      console.log('📥 PostHog: Loading script...');
      const script = document.createElement('script');
      script.src = 'https://eu-assets.i.posthog.com/static/array.js';
      script.async = true;
      
      await new Promise((resolve, reject) => {
        script.onload = () => {
          console.log('✅ PostHog: Script loaded successfully');
          resolve(true);
        };
        script.onerror = (error) => {
          console.error('❌ PostHog: Script failed to load (likely blocked by ad blocker)', error);
          isPostHogBlocked = true;
          // Don't reject - we'll use fallback
          resolve(false);
        };
        document.head.appendChild(script);
        
        // Timeout fallback in case script never loads
        setTimeout(() => {
          if (!script.onload) {
            console.warn('⏰ PostHog: Script load timeout (likely blocked)');
            isPostHogBlocked = true;
            resolve(false);
          }
        }, 5000);
      });

      if (!isPostHogBlocked) {
        // Initialize PostHog
        console.log('⚙️ PostHog: Initializing with config...');
        window.posthog = window.posthog || [];
        window.posthog.init(apiKey, {
          api_host: "/ingest",
          ui_host: "https://eu.posthog.com",
          person_profiles: "always",
          capture_pageview: false, // We'll manually track navigation
          capture_exceptions: true,
          debug: true, // Always enable debug for now
          loaded: (posthog: any) => {
            console.log('🎉 PostHog: Initialization complete!', posthog);
          }
        });
        
        posthogInstance = window.posthog;
        
        // Test capture to verify everything works
        console.log('🧪 PostHog: Testing with a test event...');
        if (posthogInstance && typeof posthogInstance.capture === 'function') {
          posthogInstance.capture('test_event', { test: true, timestamp: new Date().toISOString() });
          console.log('✅ PostHog: Test event sent!');
        }
      } else {
        console.warn('🔄 PostHog: Script blocked, using fallback analytics');
        initializeFallbackAnalytics();
      }
    }

    isInitialized = true;
    return posthogInstance;
  } catch (error) {
    console.error('❌ PostHog: Failed to initialize:', error);
    isInitialized = true; // Mark as initialized to prevent retries
    return null;
  } finally {
    isInitializing = false;
  }
};

// Analytics capture function
const captureEvent = async (
  eventName: EventName,
  properties?: Record<PropertyName | string, any>
) => {
  // Only run in browser
  if (typeof window === 'undefined') {
    console.log('⚠️ Analytics: Skipping capture (server-side)');
    return;
  }

  try {
    console.log('📊 Analytics: Capturing event:', eventName, properties);
    
    if (isPostHogBlocked) {
      // Use fallback when PostHog is blocked
      console.log('🔄 Analytics: Using fallback (PostHog blocked)');
      await sendEventDirectly(eventName, properties || {});
      return;
    }
    
    const posthog = await initializePostHog();
    if (posthog && typeof posthog.capture === 'function') {
      posthog.capture(eventName, properties);
      console.log('✅ Analytics: Event captured successfully');
    } else {
      console.warn('⚠️ Analytics: PostHog not available, trying fallback');
      await sendEventDirectly(eventName, properties || {});
    }
  } catch (error) {
    console.error('❌ Analytics: Capture failed:', error);
    // Try fallback as last resort
    try {
      await sendEventDirectly(eventName, properties || {});
    } catch (fallbackError) {
      console.error('❌ Analytics: Fallback also failed:', fallbackError);
    }
  }
};

// Analytics functions
export const analytics = {
  // Model events
  modelUploadStarted: (fileName: string, fileSize: number) => {
    captureEvent(ANALYTICS_EVENTS.MODEL_UPLOAD_STARTED, {
      [ANALYTICS_PROPERTIES.FILE_NAME]: fileName,
      [ANALYTICS_PROPERTIES.FILE_SIZE]: fileSize,
    });
  },

  modelUploadSuccess: (modelId: string, modelName: string, modelType?: string, featureCount?: number) => {
    captureEvent(ANALYTICS_EVENTS.MODEL_UPLOAD_SUCCESS, {
      [ANALYTICS_PROPERTIES.MODEL_ID]: modelId,
      [ANALYTICS_PROPERTIES.MODEL_NAME]: modelName,
      [ANALYTICS_PROPERTIES.MODEL_TYPE]: modelType,
      [ANALYTICS_PROPERTIES.FEATURE_COUNT]: featureCount,
    });
  },

  modelUploadError: (fileName: string, error: string) => {
    captureEvent(ANALYTICS_EVENTS.MODEL_UPLOAD_ERROR, {
      [ANALYTICS_PROPERTIES.FILE_NAME]: fileName,
      [ANALYTICS_PROPERTIES.ERROR_MESSAGE]: error,
    });
  },

  modelDeleted: (modelId: string, modelName: string) => {
    captureEvent(ANALYTICS_EVENTS.MODEL_DELETED, {
      [ANALYTICS_PROPERTIES.MODEL_ID]: modelId,
      [ANALYTICS_PROPERTIES.MODEL_NAME]: modelName,
    });
  },

  modelSelected: (modelId: string, modelName: string) => {
    captureEvent(ANALYTICS_EVENTS.MODEL_SELECTED, {
      [ANALYTICS_PROPERTIES.MODEL_ID]: modelId,
      [ANALYTICS_PROPERTIES.MODEL_NAME]: modelName,
    });
  },

  modelListViewed: (modelCount: number) => {
    captureEvent(ANALYTICS_EVENTS.MODEL_LIST_VIEWED, {
      model_count: modelCount,
    });
  },

  // Chat events
  chatSessionStarted: (clientId: string) => {
    captureEvent(ANALYTICS_EVENTS.CHAT_SESSION_STARTED, {
      [ANALYTICS_PROPERTIES.CLIENT_ID]: clientId,
    });
  },

  chatMessageSent: (messageLength: number, clientId: string) => {
    captureEvent(ANALYTICS_EVENTS.CHAT_MESSAGE_SENT, {
      [ANALYTICS_PROPERTIES.MESSAGE_LENGTH]: messageLength,
      [ANALYTICS_PROPERTIES.CLIENT_ID]: clientId,
    });
  },

  chatMessageReceived: (messageLength: number, clientId: string) => {
    captureEvent(ANALYTICS_EVENTS.CHAT_MESSAGE_RECEIVED, {
      [ANALYTICS_PROPERTIES.MESSAGE_LENGTH]: messageLength,
      [ANALYTICS_PROPERTIES.CLIENT_ID]: clientId,
    });
  },

  chatMessageError: (error: string, clientId: string) => {
    captureEvent(ANALYTICS_EVENTS.CHAT_MESSAGE_ERROR, {
      [ANALYTICS_PROPERTIES.ERROR_MESSAGE]: error,
      [ANALYTICS_PROPERTIES.CLIENT_ID]: clientId,
    });
  },

  // Navigation events
  viewChanged: (viewName: string, previousView?: string) => {
    captureEvent(ANALYTICS_EVENTS.VIEW_CHANGED, {
      [ANALYTICS_PROPERTIES.VIEW_NAME]: viewName,
      [ANALYTICS_PROPERTIES.PREVIOUS_VIEW]: previousView,
    });
  },

  // Connection events
  websocketConnected: (clientId: string) => {
    captureEvent(ANALYTICS_EVENTS.WEBSOCKET_CONNECTED, {
      [ANALYTICS_PROPERTIES.CLIENT_ID]: clientId,
    });
  },

  websocketDisconnected: (clientId: string, reason?: string) => {
    captureEvent(ANALYTICS_EVENTS.WEBSOCKET_DISCONNECTED, {
      [ANALYTICS_PROPERTIES.CLIENT_ID]: clientId,
      disconnect_reason: reason,
    });
  },

  websocketError: (clientId: string, error: string) => {
    captureEvent(ANALYTICS_EVENTS.WEBSOCKET_ERROR, {
      [ANALYTICS_PROPERTIES.CLIENT_ID]: clientId,
      [ANALYTICS_PROPERTIES.ERROR_MESSAGE]: error,
    });
  },

  websocketReconnect: (clientId: string, attemptNumber: number) => {
    captureEvent(ANALYTICS_EVENTS.WEBSOCKET_RECONNECT, {
      [ANALYTICS_PROPERTIES.CLIENT_ID]: clientId,
      [ANALYTICS_PROPERTIES.CONNECTION_ATTEMPT]: attemptNumber,
    });
  },
};

// Export status check functions
export const getAnalyticsStatus = () => ({
  isPostHogBlocked,
  isInitialized,
  isInitializing,
  fallbackEventsCount: fallbackEvents.length,
  hasPostHogInstance: !!posthogInstance
});

export default analytics;

// Extend window type for TypeScript
declare global {
  interface Window {
    posthog: any;
  }
} 