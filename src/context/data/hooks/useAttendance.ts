import { useState, useEffect, useCallback } from 'react';
import type { Attendance } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { useOrganizationAwareQuery } from '@/hooks/useOrganizationAwareQuery';
import { useAuthContext } from '@/context/AuthContext';

export const useAttendance = () => {
    const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { applyOrganizationFilter } = useOrganizationAwareQuery();
    const { organizationId, isSuperAdmin } = useOrganizationFilter();
    const { currentUser, isAuthenticated } = useAuthContext();

    // Set up real-time subscription for attendance data
    useEffect(() => {
        if (!organizationId) {
            console.log("No organization ID available for real-time subscription");
            return;
        }

        console.log("Setting up real-time subscription for attendance in org:", organizationId);
        
        const channelName = `attendance-changes-${organizationId}`;
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'attendance',
                    filter: `organization_id=eq.${organizationId}`
                },
                (payload) => {
                    console.log('Attendance real-time update received:', payload);
                    
                    try {
                        if (payload.eventType === 'INSERT' && payload.new) {
                            const newAttendance = payload.new as Attendance;
                            setAttendanceRecords(prev => {
                                const exists = (prev || []).some(a => a.id === newAttendance.id);
                                if (exists) {
                                    console.log("Attendance already exists, skipping insert");
                                    return prev || [];
                                }
                                console.log("Adding new attendance from real-time:", newAttendance.id);
                                return [...(prev || []), newAttendance];
                            });
                        } else if (payload.eventType === 'UPDATE' && payload.new) {
                            const updatedAttendance = payload.new as Attendance;
                            setAttendanceRecords(prev => {
                                const updated = (prev || []).map(record => 
                                    record.id === updatedAttendance.id ? updatedAttendance : record
                                );
                                console.log("Updated attendance from real-time:", updatedAttendance.id);
                                return updated;
                            });
                        } else if (payload.eventType === 'DELETE' && payload.old) {
                            const deletedId = payload.old.id;
                            setAttendanceRecords(prev => {
                                const filtered = (prev || []).filter(record => record.id !== deletedId);
                                console.log("Removed attendance from real-time:", deletedId);
                                return filtered;
                            });
                        }
                    } catch (error) {
                        console.error('Error handling real-time attendance update:', error);
                    }
                }
            )
            .subscribe((status) => {
                console.log("Real-time subscription status:", status);
                if (status === 'SUBSCRIBED') {
                    console.log("Successfully subscribed to attendance changes");
                } else if (status === 'CHANNEL_ERROR') {
                    console.error("Error in real-time channel");
                    setError("Real-time sync error - data may not be current");
                } else if (status === 'TIMED_OUT') {
                    console.warn("Real-time subscription timed out");
                    setError("Connection timeout - data may not be current");
                }
            });

        return () => {
            console.log("Cleaning up attendance real-time subscription");
            supabase.removeChannel(channel);
        };
    }, [organizationId]);

    const addAttendance = async (attendanceData: Omit<Attendance, 'id'>) => {
        console.log("useAttendance addAttendance called with:", attendanceData);
        if (!attendanceData || typeof attendanceData !== 'object') {
            const errorMsg = 'Invalid attendance data provided';
            console.error(errorMsg, attendanceData);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        // Validate required fields
        if (!attendanceData.mechanic_id) {
            const errorMsg = 'Mechanic ID is required';
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        if (!attendanceData.date) {
            const errorMsg = 'Date is required';
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        if (!attendanceData.check_in) {
            const errorMsg = 'Check-in time is required';
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        if (!isAuthenticated || !currentUser) {
            const errorMsg = 'You must be logged in to create attendance records';
            console.error(errorMsg);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        // Get organization ID with fallback to user's org
        const finalOrgId = organizationId || currentUser?.organization_id;
        if (!finalOrgId) {
            const errorMsg = 'No organization ID available. Please contact your administrator.';
            console.error(errorMsg);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        const tempId = crypto.randomUUID();
        const newAttendanceData = {
            ...attendanceData,
            id: tempId,
            organization_id: finalOrgId,
            created_at: new Date().toISOString(),
            status: attendanceData.status || 'pending',
            // Ensure required fields are present
            check_in: attendanceData.check_in,
            date: attendanceData.date,
            mechanic_id: attendanceData.mechanic_id
        };

        // Optimistic update - add to UI immediately
        setAttendanceRecords((prev) => [...(prev || []), newAttendanceData as Attendance]);
        setLoading(true);
        setError(null);

        try {
            console.log("Adding attendance:", newAttendanceData);
            const { data, error } = await supabase
                .from('attendance')
                .insert(newAttendanceData)
                .select();
            
            if (error) {
                // Rollback optimistic update
                setAttendanceRecords((prev) => (prev || []).filter(a => a.id !== tempId));
                console.error('Error adding attendance:', error);
                const errorMsg = error.message || 'Failed to add attendance record';
                setError(errorMsg);
                toast.error(errorMsg);
                throw error;
            }
            
            if (data && data.length > 0) {
                const result = data[0] as Attendance;
                // Replace optimistic entry with real data
                setAttendanceRecords((prev) => (prev || []).map(a => a.id === tempId ? result : a));
                console.log("Attendance added successfully:", result);
                return result;
            }
            
            // Keep optimistic update if no data returned but no error
            console.log("Attendance added (optimistic update kept)");
            return newAttendanceData as Attendance;
        } catch (error: any) {
            // Rollback optimistic update on error
            setAttendanceRecords((prev) => (prev || []).filter(a => a.id !== tempId));
            console.error('Error adding attendance:', error);
            const errorMsg = error?.message || 'Failed to add attendance record';
            setError(errorMsg);
            toast.error(errorMsg);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateAttendance = async (id: string, updates: Partial<Attendance>) => {
        if (!id?.trim()) {
            const errorMsg = 'Attendance ID is required for update';
            console.error(errorMsg);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        if (!updates || Object.keys(updates).length === 0) {
            console.log("No updates provided");
            return;
        }

        // Store original record for rollback
        const originalRecord = attendanceRecords.find(a => a.id === id);
        if (!originalRecord) {
            const errorMsg = 'Attendance record not found for update';
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        // Optimistic update
        const optimisticRecord = {
            ...originalRecord,
            ...updates
        };
        setAttendanceRecords((prev) => (prev || []).map((item) => item.id === id ? optimisticRecord : item));
        setLoading(true);
        setError(null);

        try {
            console.log("Updating attendance:", id, updates);
            const { data, error } = await supabase
                .from('attendance')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                // Rollback optimistic update
                setAttendanceRecords((prev) => (prev || []).map((item) => item.id === id ? originalRecord : item));
                console.error('Error updating attendance:', error);
                const errorMsg = error.message || 'Failed to update attendance record';
                setError(errorMsg);
                toast.error(errorMsg);
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Attendance;
                // Replace optimistic update with real data
                setAttendanceRecords((prev) => (prev || []).map((item) => item.id === id ? result : item));
                
                // Show appropriate success message based on update type
                if (updates.status === 'approved') {
                    toast.success('Attendance record approved successfully');
                } else if (updates.status === 'rejected') {
                    toast.success('Attendance record rejected');
                } else {
                    toast.success('Attendance record updated successfully');
                }
                
                console.log("Attendance updated successfully:", result);
                return result;
            } else {
                console.warn("No data returned from attendance update, keeping optimistic update");
                return optimisticRecord;
            }
        } catch (error: any) {
            // Rollback optimistic update
            setAttendanceRecords((prev) => (prev || []).map((item) => item.id === id ? originalRecord : item));
            console.error('Error updating attendance:', error);
            const errorMsg = error?.message || 'Failed to update attendance record';
            setError(errorMsg);
            toast.error(errorMsg);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const removeAttendance = async (id: string) => {
        if (!id?.trim()) {
            const errorMsg = 'Attendance ID is required for deletion';
            console.error(errorMsg);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        setLoading(true);
        setError(null);

        try {
            console.log("Removing attendance:", id);
            const { error } = await supabase.from('attendance').delete().eq('id', id);
            
            if (error) {
                console.error('Error removing attendance:', error);
                const errorMsg = error.message || 'Failed to delete attendance record';
                setError(errorMsg);
                toast.error(errorMsg);
                throw error;
            }
            
            setAttendanceRecords((prev) => (prev || []).filter((item) => item.id !== id));
            toast.success('Attendance record deleted successfully');
            console.log("Attendance removed successfully:", id);
        } catch (error: any) {
            console.error('Error removing attendance:', error);
            const errorMsg = error?.message || 'Failed to delete attendance record';
            setError(errorMsg);
            toast.error(errorMsg);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const loadAttendance = useCallback(async (retryCount = 0) => {
        setLoading(true);
        setError(null);

        try {
            console.log("Loading attendance from Supabase...", { retryCount });
            
            // Check if organization context is available
            if (!organizationId) {
                console.warn("No organization ID available, skipping attendance load");
                setAttendanceRecords([]);
                return;
            }

            const query = supabase.from('attendance').select('*');
            
            // Apply organization filter
            const result = await applyOrganizationFilter(query);
            const { data: attendanceData, error: attendanceError } = result;
            
            if (attendanceError) {
                console.error('Error fetching attendance:', attendanceError);
                
                // Specific error handling
                if (attendanceError.message?.includes('JWT')) {
                    const errorMsg = 'Authentication expired - please refresh the page';
                    setError(errorMsg);
                    toast.error(errorMsg);
                    return;
                }
                
                if (attendanceError.message?.includes('permission')) {
                    const errorMsg = 'No permission to access attendance data';
                    setError(errorMsg);
                    toast.error(errorMsg);
                    return;
                }
                
                // Retry logic for transient errors
                if (retryCount < 3 && (
                    attendanceError.message?.includes('timeout') || 
                    attendanceError.message?.includes('network') ||
                    attendanceError.message?.includes('connection')
                )) {
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
                    console.log(`Retrying attendance load in ${delay}ms (attempt ${retryCount + 1}/3)`);
                    setTimeout(() => loadAttendance(retryCount + 1), delay);
                    return;
                }
                
                const errorMsg = attendanceError.message || 'Failed to load attendance records';
                setError(errorMsg);
                throw attendanceError;
            }

            console.log("Attendance loaded successfully:", attendanceData?.length || 0, "records");
            setAttendanceRecords(attendanceData || []);
        } catch (error: any) {
            console.error('Error loading attendance:', error);
            const errorMsg = error?.message || 'Failed to load attendance records';
            setError(errorMsg);
            
            // Don't show toast on retry attempts
            if (retryCount === 0) {
                toast.error(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    }, [organizationId, applyOrganizationFilter]);

    return {
        attendanceRecords,
        loading,
        error,
        addAttendance,
        updateAttendance,
        removeAttendance,
        loadAttendance
    };
};
