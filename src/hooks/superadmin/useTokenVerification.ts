
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useTokenVerification = () => {
  const { toast } = useToast();

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      // Create proper authorization header with Bearer prefix
      const headers = {
        Authorization: `Bearer ${token}`
      };
      
      console.log("Sending verification request with token:", token.substring(0, 20) + '...');
      
      // Make the verification request with authorization header
      const { data, error } = await supabase.functions.invoke('admin-utils', {
        body: { action: 'verify_token' },
        headers
      });
      
      if (error) {
        console.error("Token verification error:", error);
        localStorage.removeItem('superadminToken');
        return false;
      }
      
      if (data?.verified === true) {
        console.log("Token verification successful:", data);
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
