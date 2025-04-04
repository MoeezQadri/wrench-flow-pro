
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useTokenVerification = () => {
  const { toast } = useToast();

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      // CRITICAL: Set the auth token for all supabase API calls
      supabase.functions.setAuth(token);
      
      console.log("Sending verification request with token...");
      
      // Make the verification request with proper authorization
      const { data, error } = await supabase.functions.invoke('admin-utils', {
        body: { action: 'verify_token' }
      });
      
      if (error) {
        console.error("Token verification error:", error);
        localStorage.removeItem('superadminToken');
        return false;
      }
      
      if (data?.verified === true) {
        console.log("Token verification successful");
        return true;
      } else {
        console.error("Invalid token response:", data);
        localStorage.removeItem('superadminToken');
        return false;
      }
    } catch (err) {
      console.error("Token verification error:", err);
      localStorage.removeItem('superadminToken');
      return false;
    }
  };

  return {
    verifyToken
  };
};
