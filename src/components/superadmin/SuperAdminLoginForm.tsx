
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertTriangle, Info, LockKeyhole, User } from 'lucide-react';
import { Link } from 'react-router-dom';

// Form validation schema
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
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
      email: '',
      password: ''
    }
  });

  const handleFormSubmit = async (data: SuperAdminLoginFormData) => {
    await onSubmit(data);
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
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
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email"
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
            
            <div className="mt-2 text-center">
              <Link to="/superadmin/create" className="text-sm text-blue-600 hover:text-blue-800">
                Create a new superadmin account
              </Link>
            </div>
            
            <div className="mt-6 border rounded-lg p-3 bg-slate-50">
              <div className="flex items-center space-x-2 mb-2 text-sm text-gray-700">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="font-medium">SuperAdmin Access</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                To login, you need to have a Supabase user account with the role of 'superuser' in the user metadata.
              </p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SuperAdminLoginForm;
