
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Help = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Learn the basics of WrenchFlow Pro</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Welcome to WrenchFlow Pro! This guide will help you understand the key features 
            and get you up and running with our auto repair shop management system.</p>
            <ul className="list-disc pl-5 mt-4 space-y-2">
              <li>Dashboard overview</li>
              <li>Managing customers and vehicles</li>
              <li>Creating and managing invoices</li>
              <li>Scheduling tasks and assignments</li>
              <li>Inventory management</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>Get help from our support team</CardDescription>
          </CardHeader>
          <CardContent>
            <p>If you need assistance or have questions about WrenchFlow Pro, our support team is here to help.</p>
            <div className="mt-4 space-y-2">
              <p><strong>Email:</strong> support@wrenchflow.com</p>
              <p><strong>Phone:</strong> (555) 123-4567</p>
              <p><strong>Hours:</strong> Monday-Friday, 9AM-5PM EST</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">How do I create a new invoice?</h3>
              <p className="text-muted-foreground">Go to the Invoices section and click on "New Invoice" button. 
              You can then select a customer, add items, and complete the invoice details.</p>
            </div>
            <div>
              <h3 className="font-medium">How do I track mechanic hours?</h3>
              <p className="text-muted-foreground">Use the Attendance section to check in and check out mechanics. 
              You can view detailed reports in the Reports section.</p>
            </div>
            <div>
              <h3 className="font-medium">Can I customize invoice templates?</h3>
              <p className="text-muted-foreground">Yes, go to Settings and select "Invoice Templates" to customize 
              the appearance and information displayed on your invoices.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;
