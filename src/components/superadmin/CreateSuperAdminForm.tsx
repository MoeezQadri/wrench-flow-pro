
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
});

type FormData = z.infer<typeof formSchema>;

const CreateSuperAdminForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      username: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await supabase.functions.invoke('create-superadmin', {
        body: {
          email: data.email,
          password: data.password,
          username: data.username,
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to create superadmin user");
      }
      
      setSuccess(true);
      form.reset();
      toast({
        title: "Success!",
        description: "Superadmin user has been created successfully",
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create superadmin user",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Superadmin User</CardTitle>
        <CardDescription>
          Create a new superadmin user with full system access
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-500" />
            <AlertDescription>Superadmin created successfully!</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="email">Email</Label>
                  <FormControl>
                    <Input 
                      id="email" 
                      placeholder="admin@example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="username">Username</Label>
                  <FormControl>
                    <Input 
                      id="username" 
                      placeholder="superadmin" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="password">Password</Label>
                  <FormControl>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="********" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Superadmin"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateSuperAdminForm;
