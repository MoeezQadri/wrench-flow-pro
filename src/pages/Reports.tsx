
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign, FileText } from "lucide-react";

const Reports = () => {
  const reports = [
    {
      title: "Attendance Report",
      description: "Track mechanic attendance and working hours",
      icon: <Calendar className="h-8 w-8 text-primary" />,
      path: "/reports/attendance"
    },
    {
      title: "Tasks Report",
      description: "View time spent on tasks and mechanic efficiency",
      icon: <Clock className="h-8 w-8 text-primary" />,
      path: "/reports/tasks"
    },
    {
      title: "Finance Report",
      description: "Daily financial summary with cash in hand",
      icon: <DollarSign className="h-8 w-8 text-primary" />,
      path: "/reports/finance"
    },
    {
      title: "Invoicing Summary",
      description: "Overview of invoices by status and payment",
      icon: <FileText className="h-8 w-8 text-primary" />,
      path: "/reports/finance"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                {report.icon}
              </div>
              <CardTitle className="text-xl mt-4">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardFooter className="bg-muted/50 pt-3">
              <Button asChild className="w-full">
                <Link to={report.path}>View Report</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reports;
