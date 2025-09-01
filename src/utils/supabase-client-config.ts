import { supabase } from '@/integrations/supabase/client';

// Use existing supabase client to avoid multiple instances
export const supabaseEnhanced = supabase;

const SUPABASE_URL = "https://zugmebtirwpdkblijlvx.supabase.co";

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(SUPABASE_URL + '/rest/v1/', {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Simplified loading recovery utilities
export class LoadingRecovery {
  private static loadingTimers = new Map<string, any>();
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