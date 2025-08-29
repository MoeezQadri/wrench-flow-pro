import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://zugmebtirwpdkblijlvx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z21lYnRpcndwZGtibGlqbHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MzU4MTEsImV4cCI6MjA1OTIxMTgxMX0.qSHZrBUacqnjqBH9XDY_6Bq-C5jYpdJTg9V_kN4ghiw";

// Enhanced Supabase client with timeout and retry configuration
export const supabaseEnhanced = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
      },
      fetch: (url, options = {}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const enhancedOptions = {
          ...options,
          signal: controller.signal,
        };

        return fetch(url, enhancedOptions)
          .finally(() => clearTimeout(timeoutId))
          .catch((error) => {
            if (error.name === 'AbortError') {
              throw new Error('Request timeout - please check your connection and try again');
            }
            throw error;
          });
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: (tries) => Math.min(tries * 1000, 30000),
    }
  }
);

// Connection monitoring utilities
export class ConnectionMonitor {
  private static instance: ConnectionMonitor;
  private isOnline = navigator.onLine;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: ((isOnline: boolean) => void)[] = [];

  private constructor() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  static getInstance(): ConnectionMonitor {
    if (!ConnectionMonitor.instance) {
      ConnectionMonitor.instance = new ConnectionMonitor();
    }
    return ConnectionMonitor.instance;
  }

  private handleOnline() {
    this.isOnline = true;
    this.reconnectAttempts = 0;
    this.notifyListeners();
  }

  private handleOffline() {
    this.isOnline = false;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  public addListener(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  public async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(SUPABASE_URL + '/rest/v1/', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Loading recovery utilities
export class LoadingRecovery {
  private static loadingTimers = new Map<string, NodeJS.Timeout>();
  private static readonly LOADING_TIMEOUT = 15000; // 15 seconds

  static startLoadingTimer(key: string, onTimeout: () => void) {
    this.clearLoadingTimer(key);
    const timer = setTimeout(() => {
      console.warn(`Loading timeout detected for: ${key}`);
      onTimeout();
    }, this.LOADING_TIMEOUT);
    this.loadingTimers.set(key, timer);
  }

  static clearLoadingTimer(key: string) {
    const timer = this.loadingTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.loadingTimers.delete(key);
    }
  }

  static clearAllTimers() {
    this.loadingTimers.forEach(timer => clearTimeout(timer));
    this.loadingTimers.clear();
  }
}

// Request deduplication utility
export class RequestDeduplication {
  private static pendingRequests = new Map<string, Promise<any>>();

  static async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      console.log(`Deduplicating request: ${key}`);
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const promise = requestFn()
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  static clearPendingRequest(key: string) {
    this.pendingRequests.delete(key);
  }

  static clearAllPendingRequests() {
    this.pendingRequests.clear();
  }
}