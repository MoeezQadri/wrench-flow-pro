
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

  const handleCredentialsFill = (username: string, password: string) => {
    form.setValue('username', username);
    form.setValue('password', password);
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
            
            <div className="mt-6 border rounded-lg p-3 bg-slate-50">
              <div className="flex items-center space-x-2 mb-2 text-sm text-gray-700">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Demo Access</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Superadmin credentials are now stored in the database.
                Use the default accounts below for testing:
              </p>
              <div className="grid gap-2">
                <div className="border rounded p-2 text-xs bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                     onClick={() => handleCredentialsFill('admin', 'superadmin2023')}>
                  <div className="font-semibold">Option 1</div>
                  <div>Username: <span className="text-blue-600">admin</span></div>
                  <div>Password: <span className="text-blue-600">superadmin2023</span></div>
                </div>
                <div className="border rounded p-2 text-xs bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                     onClick={() => handleCredentialsFill('superadmin', 'admin1234')}>
                  <div className="font-semibold">Option 2</div>
                  <div>Username: <span className="text-blue-600">superadmin</span></div>
                  <div>Password: <span className="text-blue-600">admin1234</span></div>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SuperAdminLoginForm;
