import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, UserRole } from "@/types";

const SuperAdminLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { signIn, setCurrentUser, setSession } = useAuthContext();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description:
            error.message || "Invalid credentials. Please try again.",
        });
        return;
      }

      toast({
        title: "Access granted",
        description: "Welcome to the Super Admin portal",
      });

      navigate("/superadmin/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "An error occurred during authentication.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuperAdminLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log({ email, password });
      // First try with standard Supabase authentication
      const { data: supabaseData, error: supabaseError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      console.log({ supabaseData });

      if (supabaseError) {
        console.error("Login failed:", supabaseError.message);
        return;
      }

      // Get the signed-in user's ID
      const user = supabaseData.user;
      if (!user) {
        console.error("No user returned after sign-in");
        return;
      }

      // Fetching the user’s role from `profiles` table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Failed to fetch profile:", profileError.message);
        return;
      }

      console.log("User role:", profile.role);

      if (supabaseData?.session) {
        // Check if the user has superadmin role
        if (
          profile.role === "superuser" ||
          profile.role === "superadmin" ||
          profile.role === "owner"
        ) {
          // If standard auth failed or user is not superadmin, try with custom superadmin auth
          const response = await supabase.functions.invoke("admin-utils", {
            body: {
              action: "authenticate_superadmin",
              params: {
                userid: supabaseData.user.id,
              },
            },
          });

          if (response.error) {
            throw new Error(response.error.message || "Authentication failed");
          }

          const { authenticated, token, superadmin } = response.data;
          console.log(
            "[superadminlogin authenticate_superadmin]",
            response.data
          );

          if (!authenticated || !token) {
            toast({
              variant: "destructive",
              title: "Access denied",
              description: "Invalid credentials. Please try again.",
            });
            setIsLoading(false);
            return;
          }

          // Store superadmin token
          localStorage.setItem("superadminToken", token);
          localStorage.setItem(
            "access_token",
            supabaseData.session.access_token
          );

          // Configure Supabase functions to use the token
          supabase.functions.setAuth(supabaseData.session.access_token);

          // Create a mock session for the superadmin
          const mockSession = {
            access_token: token,
            refresh_token: "",
            expires_at: Date.now() + 24 * 3600000, // 24 hours from now
            user: {
              id: superadmin.id,
              email: email,
              user_metadata: {
                name: "Super Admin",
                role: "superuser",
              },
            },
          };

          // Create a superadmin user object for context
          const superadminUser: User = {
            id: superadmin.id,
            email: email,
            name: "Super Admin",
            role: "superuser" as UserRole,
            is_active: true,
            lastLogin: new Date().toISOString(),
            created_at: supabaseData.user.created_at,
          };

          // Update auth context with superadmin user
          setCurrentUser(superadminUser);
          setSession(mockSession as any);

          toast({
            title: "Access granted",
            description: "Welcome to the SuperAdmin portal",
          });

          navigate("/superadmin/dashboard");
          return;
        } else {
          // Not a superadmin, sign out
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Authentication error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during authentication.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="mb-8 text-center">
        <Logo size="lg" />
        <h1 className="mt-4 text-2xl font-bold">Super Admin Access</h1>
        <p className="text-muted-foreground mt-1">
          Restricted area for system administrators
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Super Admin Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSuperAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-8 w-full max-w-md">
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">
              This area is restricted to system administrators only.
            </p>
            <p>If you need access, please contact your system administrator.</p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <a href="/" className="text-primary hover:underline text-sm">
          Return to main application
        </a>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
