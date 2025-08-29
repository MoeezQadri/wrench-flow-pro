import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationFilter } from './useOrganizationFilter';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeOptions {
  enableInitialLoad?: boolean;
  conflictResolution?: 'optimistic' | 'server-wins' | 'merge';
  maxReconnectAttempts?: number;
}

export const useEnhancedRealtime = <T extends { id: string; organization_id?: string }>(
  tableName: string,
  data: T[],
  setData: (data: T[] | ((prev: T[]) => T[])) => void,
  options: RealtimeOptions = {}
) => {
  const {
    enableInitialLoad = false,
    conflictResolution = 'server-wins',
    maxReconnectAttempts = 5,
  } = options;

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { organizationId, canAccessAllOrganizations } = useOrganizationFilter();

  useEffect(() => {
    if (!organizationId && !canAccessAllOrganizations) {
      console.log(`Skipping realtime subscription for ${tableName} - no organization context`);
      return;
    }

    const setupRealtime = () => {
      // Clean up existing channel
      if (channelRef.current) {
        console.log(`Cleaning up existing ${tableName} realtime channel`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create channel with organization-specific name for better isolation
      const channelName = canAccessAllOrganizations 
        ? `${tableName}-global` 
        : `${tableName}-${organizationId}`;

      console.log(`Setting up realtime subscription for ${tableName} (${channelName})`);

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName,
            filter: canAccessAllOrganizations ? undefined : `organization_id=eq.${organizationId}`
          },
          (payload) => {
            console.log(`Realtime ${tableName} update:`, payload.eventType, payload);
            handleRealtimeUpdate(payload);
          }
        )
        .subscribe((status) => {
          console.log(`${tableName} realtime status:`, status);
          
          if (status === 'SUBSCRIBED') {
            setIsSubscribed(true);
            setReconnectAttempts(0);
          } else if (status === 'CHANNEL_ERROR') {
            setIsSubscribed(false);
            handleReconnect();
          } else if (status === 'TIMED_OUT') {
            setIsSubscribed(false);
            console.warn(`${tableName} realtime subscription timed out`);
            handleReconnect();
          }
        });

      channelRef.current = channel;
    };

    const handleRealtimeUpdate = (payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      setData((prevData) => {
        let updatedData = [...prevData];

        try {
          switch (eventType) {
            case 'INSERT':
              if (newRecord) {
                const exists = updatedData.some(item => item.id === newRecord.id);
                if (!exists) {
                  // Check organization filter for new records
                  if (canAccessAllOrganizations || newRecord.organization_id === organizationId) {
                    updatedData = [...updatedData, newRecord as T];
                    console.log(`Added ${tableName} via realtime:`, newRecord.id);
                  }
                } else if (conflictResolution === 'server-wins') {
                  // Replace optimistic update with server data
                  updatedData = updatedData.map(item => 
                    item.id === newRecord.id ? newRecord as T : item
                  );
                  console.log(`Updated ${tableName} via realtime (server-wins):`, newRecord.id);
                }
              }
              break;

            case 'UPDATE':
              if (newRecord) {
                const existingIndex = updatedData.findIndex(item => item.id === newRecord.id);
                if (existingIndex !== -1) {
                  if (conflictResolution === 'server-wins') {
                    updatedData[existingIndex] = newRecord as T;
                  } else if (conflictResolution === 'merge') {
                    updatedData[existingIndex] = { ...updatedData[existingIndex], ...newRecord as T };
                  }
                  console.log(`Updated ${tableName} via realtime:`, newRecord.id);
                } else {
                  // Item not in local state, add it if it belongs to our organization
                  if (canAccessAllOrganizations || newRecord.organization_id === organizationId) {
                    updatedData = [...updatedData, newRecord as T];
                    console.log(`Added missing ${tableName} via realtime update:`, newRecord.id);
                  }
                }
              }
              break;

            case 'DELETE':
              if (oldRecord) {
                updatedData = updatedData.filter(item => item.id !== oldRecord.id);
                console.log(`Deleted ${tableName} via realtime:`, oldRecord.id);
              }
              break;

            default:
              console.warn(`Unknown realtime event type for ${tableName}:`, eventType);
          }
        } catch (error) {
          console.error(`Error processing realtime update for ${tableName}:`, error);
        }

        return updatedData;
      });
    };

    const handleReconnect = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.error(`Max reconnect attempts reached for ${tableName} realtime`);
        return;
      }

      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      console.log(`Attempting to reconnect ${tableName} realtime in ${delay}ms`);
      
      setTimeout(() => {
        setReconnectAttempts(prev => prev + 1);
        setupRealtime();
      }, delay);
    };

    // Initial setup
    setupRealtime();

    // Cleanup function
    return () => {
      console.log(`Cleaning up ${tableName} realtime subscription`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsSubscribed(false);
      setReconnectAttempts(0);
    };
  }, [tableName, organizationId, canAccessAllOrganizations, setData, conflictResolution, maxReconnectAttempts]);

  return {
    isSubscribed,
    reconnectAttempts,
    forceReconnect: () => {
      setReconnectAttempts(0);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      // The useEffect will automatically set up a new connection
    }
  };
};