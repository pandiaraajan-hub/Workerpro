import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Download, 
  FileText, 
  Users, 
  Tag, 
  GraduationCap,
  BarChart3,
  TrendingUp
} from "lucide-react";

const Reports = () => {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();


  const { data: stats } = useQuery<{
    totalWorkers: number;
    activeCourses: number;
    totalCertifications: number;
    expiringSoon: number;
  }>({
    queryKey: ['/api/stats'],
  });

  const { data: workers = [] } = useQuery<any[]>({
    queryKey: ['/api/workers'],
  });

  const { data: expiring = [] } = useQuery<any[]>({
    queryKey: ['/api/certifications/expiring/60'],
  });


  const handleExportCertifications = async () => {
    toast({
      title: "Feature coming soon",
      description: "Certifications export will be available soon.",
    });
  };

  const handleExportTraining = async () => {
    toast({
      title: "Feature coming soon",
      description: "Training records export will be available soon.",
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
            <p className="text-sm text-gray-600">View data summaries and navigate to detailed sections</p>
          </div>
          <Button onClick={() => setLocation('/workers')} className="bg-primary hover:bg-blue-700">
            <BarChart3 className="mr-2 h-4 w-4" />
            View All Data
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Workers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalWorkers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeCourses || 0}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Certifications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalCertifications || 0}</p>
                </div>
                <Tag className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Compliance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalCertifications && stats?.totalWorkers 
                      ? Math.round((stats.totalCertifications / stats.totalWorkers) * 100) 
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Data Views
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button 
                  onClick={() => setLocation('/workers')}
                  className="w-full justify-between bg-primary hover:bg-blue-700"
                >
                  <span className="flex items-center">
                    <Users className="mr-3 h-4 w-4" />
                    Workers Data
                  </span>
                  <span>→</span>
                </Button>
                
                <Button 
                  onClick={() => setLocation('/certifications')}
                  variant="outline" 
                  className="w-full justify-between"
                >
                  <span className="flex items-center">
                    <Tag className="mr-3 h-4 w-4" />
                    Certifications View
                  </span>
                  <span>→</span>
                </Button>
                
                <Button 
                  onClick={() => setLocation('/courses')}
                  variant="outline" 
                  className="w-full justify-between"
                >
                  <span className="flex items-center">
                    <GraduationCap className="mr-3 h-4 w-4" />
                    Courses View
                  </span>
                  <span>→</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Report Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center">
                    <BarChart3 className="mr-3 h-4 w-4" />
                    Compliance Summary
                  </span>
                  <span>→</span>
                </Button>
                
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center">
                    <FileText className="mr-3 h-4 w-4" />
                    Expiry Report
                  </span>
                  <span>→</span>
                </Button>
                
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center">
                    <TrendingUp className="mr-3 h-4 w-4" />
                    Training Progress
                  </span>
                  <span>→</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Report Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Workers data exported</p>
                  <p className="text-sm text-gray-600">Generated comprehensive worker report</p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-GB')}
                </div>
              </div>
              
              {expiring.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <p className="font-medium text-amber-800">Expiring certifications detected</p>
                    <p className="text-sm text-amber-600">{expiring.length} certifications need attention within 2 months</p>
                  </div>
                  <div className="text-sm text-amber-600">
                    Active Alert
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">System initialized</p>
                  <p className="text-sm text-gray-600">Worker management system ready</p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-GB')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reports;
