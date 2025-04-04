
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertTriangle, LockKeyhole, User } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" })
});

export type SuperAdminLoginFormData = z.infer<typeof formSchema>;

interface SuperAdminLoginFormProps {
  onSubmit: (data: SuperAdminLoginFormData) => Promise<void>;
  isLoading: boolean;
}

const SuperAdminLoginForm: React.FC<SuperAdminLoginFormProps> = ({ onSubmit, isLoading }) => {
  // Set up form with validation
  const form = useForm<SuperAdminLoginFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertTriangle className="h-6 w-6" />
          <CardTitle className="text-2xl">SuperAdmin Access</CardTitle>
        </div>
        <CardDescription>
          This area is restricted. Enter your credentials to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id="username"
                        placeholder="Enter username"
                        className="pr-10"
                        {...field}
                      />
                      <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
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
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        className="pr-10"
                        {...field}
                      />
                      <LockKeyhole className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700">
              {isLoading ? "Authenticating..." : "Access System"}
            </Button>
            
            <div className="text-xs text-center text-gray-500 mt-4">
              <p>Default Credentials (for demo):</p>
              <p>Username: admin | Password: superadmin2023</p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SuperAdminLoginForm;
