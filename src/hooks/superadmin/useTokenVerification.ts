
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useTokenVerification = () => {
  const { toast } = useToast();

  const verifyToken = async (): Promise<boolean> => {
    try {
      // Get the current session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error("Session error or no session:", sessionError);
        return false;
      }
      
      // Check if the user has the superadmin role in user_metadata
      const userMetadata = session.user?.user_metadata || {};
      if (userMetadata.role !== 'superuser' && userMetadata.role !== 'superadmin') {
        console.error("User doesn't have superadmin role");
        return false;
      }
      
      console.log("Token verification successful - user has superadmin privileges");
      return true;
    } catch (err) {
      console.error("Token verification error:", err);
      return false;
    }
  };

  return {
    verifyToken
  };
};
