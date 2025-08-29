import { toast } from 'sonner';

interface RefreshOptions {
  level: 'soft' | 'medium' | 'hard' | 'nuclear';
  showToast?: boolean;
  reason?: string;
}

export class GlobalRefresh {
  private static pendingRefresh = false;

  static async executeRefresh(options: RefreshOptions = { level: 'soft' }): Promise<void> {
    if (this.pendingRefresh) {
      console.warn('Refresh already in progress, skipping...');
      return;
    }

    this.pendingRefresh = true;
    
    try {
      const { level, showToast = true, reason } = options;
      
      if (showToast) {
        toast.loading(`Refreshing application (${level} refresh)${reason ? `: ${reason}` : ''}...`);
      }

      console.log(`Starting ${level} refresh${reason ? ` - ${reason}` : ''}`);

      switch (level) {
        case 'soft':
          await this.softRefresh();
          break;
        case 'medium':
          await this.mediumRefresh();
          break;
        case 'hard':
          await this.hardRefresh();
          break;
        case 'nuclear':
          await this.nuclearRefresh();
          break;
        default:
          throw new Error(`Unknown refresh level: ${level}`);
      }

      if (options.showToast) {
        toast.success('Application refreshed successfully');
      }

    } catch (error) {
      console.error('Refresh failed:', error);
      if (options.showToast) {
        toast.error(`Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      throw error;
    } finally {
      this.pendingRefresh = false;
    }
  }

  // Soft refresh: Re-fetch data without clearing cache
  private static async softRefresh(): Promise<void> {
    // Trigger a custom event that data providers can listen to
    window.dispatchEvent(new CustomEvent('global-refresh', { 
      detail: { level: 'soft' } 
    }));
    
    // Give providers time to refresh
    await this.delay(500);
  }

  // Medium refresh: Clear data cache and re-fetch
  private static async mediumRefresh(): Promise<void> {
    // Clear React Query cache if available
    if ((window as any).reactQueryClient) {
      (window as any).reactQueryClient.clear();
    }

    // Clear custom caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const dataCache = cacheNames.filter(name => name.includes('data') || name.includes('api'));
        await Promise.all(dataCache.map(name => caches.delete(name)));
      } catch (error) {
        console.warn('Failed to clear data cache:', error);
      }
    }

    // Trigger refresh event
    window.dispatchEvent(new CustomEvent('global-refresh', { 
      detail: { level: 'medium' } 
    }));
    
    await this.delay(1000);
  }

  // Hard refresh: Clear all caches and storage
  private static async hardRefresh(): Promise<void> {
    // Clear all browser caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      } catch (error) {
        console.warn('Failed to clear browser cache:', error);
      }
    }

    // Clear session storage (preserve login state in local storage)
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
    }

    // Clear temporary data from local storage (preserve auth tokens)
    try {
      const keys = Object.keys(localStorage);
      const tempKeys = keys.filter(key => 
        key.includes('temp') || 
        key.includes('cache') || 
        key.includes('draft') ||
        key.startsWith('react-query')
      );
      tempKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear temporary local storage:', error);
    }

    // Reload the page
    window.location.reload();
  }

  // Nuclear refresh: Complete reset
  private static async nuclearRefresh(): Promise<void> {
    // Clear absolutely everything except critical auth data
    const authData = this.preserveAuthData();
    
    try {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Restore auth data
      this.restoreAuthData(authData);
      
    } catch (error) {
      console.warn('Failed to clear all storage:', error);
    }

    // Force hard reload bypassing cache
    window.location.href = window.location.href;
  }

  private static preserveAuthData(): Record<string, string> {
    const authKeys = [
      'sb-' + 'zugmebtirwpdkblijlvx' + '-auth-token',
      'supabase.auth.token',
      'auth-session'
    ];
    
    const authData: Record<string, string> = {};
    
    authKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        authData[key] = value;
      }
    });
    
    return authData;
  }

  private static restoreAuthData(authData: Record<string, string>): void {
    Object.entries(authData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API for quick access
  static soft(reason?: string) {
    return this.executeRefresh({ level: 'soft', reason });
  }

  static medium(reason?: string) {
    return this.executeRefresh({ level: 'medium', reason });
  }

  static hard(reason?: string) {
    return this.executeRefresh({ level: 'hard', reason });
  }

  static nuclear(reason?: string) {
    return this.executeRefresh({ level: 'nuclear', reason });
  }
}