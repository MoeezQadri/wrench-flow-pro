
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from '@/components/ui/toaster';
import CreateSuperAdminForm from '@/components/superadmin/CreateSuperAdminForm';

const CreateSuperAdmin = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Superadmin Setup</h1>
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <CreateSuperAdminForm />
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
};

export default CreateSuperAdmin;
