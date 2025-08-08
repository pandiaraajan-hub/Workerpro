import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Users, 
  GraduationCap, 
  Tag, 
  AlertTriangle, 
  Search,
  Plus,
  Upload,
  BarChart3,
  CalendarPlus,
  Download,
  FileText
} from "lucide-react";
import type { WorkerWithCertifications } from "@shared/schema";
import WorkerModal from "@/components/worker-modal";
import WorkerForm from "@/components/worker-form";

const Dashboard = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithCertifications | null>(null);
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [showPermitModal, setShowPermitModal] = useState(false);
  const [permitModalType, setPermitModalType] = useState<'expiring' | 'expired'>('expiring');

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalWorkers: number;
    activeCourses: number;
    totalCertifications: number;
    expiringSoon: number;
    permitExpiringSoon: number;
    permitExpired: number;
  }>({
    queryKey: ['/api/stats'],
  });

  const { data: workers = [], isLoading: workersLoading } = useQuery<WorkerWithCertifications[]>({
    queryKey: ['/api/workers'],
  });

  const { data: expiringCerts = [] } = useQuery<any[]>({
    queryKey: ['/api/certifications/expiring/30'],
  });

  const recentWorkers = workers.slice(0, 4);

  // Filter workers by permit status
  const getWorkersWithPermitStatus = (type: 'expiring' | 'expired') => {
    const now = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setDate(now.getDate() + 60);
    
    if (type === 'expiring') {
      return workers.filter(worker => 
        worker.dateOfExpiry && 
        new Date(worker.dateOfExpiry) > now && 
        new Date(worker.dateOfExpiry) <= twoMonthsFromNow
      );
    } else {
      return workers.filter(worker => 
        worker.dateOfExpiry && 
        new Date(worker.dateOfExpiry) <= now
      );
    }
  };
  
  const handlePermitClick = (type: 'expiring' | 'expired') => {
    setPermitModalType(type);
    setShowPermitModal(true);
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/export/workers');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'workers.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast({
          title: "Export successful",
          description: "Workers data has been exported to Excel file.",
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export workers data.",
        variant: "destructive",
      });
    }
  };

  if (statsLoading || workersLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-600">Worker management overview and statistics</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search workers..."
                  className="w-64 pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
              <Button onClick={() => setShowWorkerForm(true)} className="bg-primary hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Worker
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/workers')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Workers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalWorkers || 0}</p>
                  <p className="text-sm text-secondary font-medium">Active employees</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-primary text-xl" />
                </div>
              </div>
            </Card>

            <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/courses')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active Courses</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.activeCourses || 0}</p>
                  <p className="text-sm text-accent font-medium">Available training</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="text-accent text-xl" />
                </div>
              </div>
            </Card>

            <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/certifications')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Certifications</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalCertifications || 0}</p>
                  <p className="text-sm text-secondary font-medium">Total issued</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Tag className="text-secondary text-xl" />
                </div>
              </div>
            </Card>

            <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/certifications')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Certificates Expiring Soon</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.expiringSoon || 0}</p>
                  <p className="text-sm text-destructive font-medium">Requires attention</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-destructive text-xl" />
                </div>
              </div>
            </Card>

            <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handlePermitClick('expiring')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Permit Expire Soon</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.permitExpiringSoon || 0}</p>
                  <p className="text-sm text-amber-600 font-medium">Within 2 months</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-amber-600 text-xl" />
                </div>
              </div>
            </Card>

            <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handlePermitClick('expired')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Expired Permit</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.permitExpired || 0}</p>
                  <p className="text-sm text-destructive font-medium">Urgent action needed</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-destructive text-xl" />
                </div>
              </div>
            </Card>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Workers */}
            <div className="lg:col-span-2">
              <Card>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Workers</h3>
                    <Button variant="ghost" className="text-primary hover:text-blue-700">
                      View All
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {recentWorkers.map((worker: WorkerWithCertifications) => (
                      <div
                        key={worker.id}
                        className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg cursor-pointer"
                        onClick={() => setSelectedWorker(worker)}
                      >
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {worker.nameOfWorkers.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{worker.nameOfWorkers}</p>
                          <p className="text-sm text-gray-500">
                            {worker.designation} • ID: {worker.workersId}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {worker.certifications.length} Certifications
                          </p>
                          <Badge variant={worker.certifications.some(c => c.status === 'expired') ? 'destructive' : 'default'}>
                            {worker.certifications.some(c => c.status === 'expired') ? 'Has Expired' : 'All Current'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Alerts */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button 
                    className="w-full justify-between bg-primary hover:bg-blue-700"
                    onClick={() => setShowWorkerForm(true)}
                  >
                    <span className="flex items-center">
                      <Upload className="mr-3 h-4 w-4" />
                      Import Excel File
                    </span>
                    <span>→</span>
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full justify-between"
                    onClick={handleExportData}
                  >
                    <span className="flex items-center">
                      <BarChart3 className="mr-3 h-4 w-4" />
                      Generate Report
                    </span>
                    <span>→</span>
                  </Button>
                  <Button variant="secondary" className="w-full justify-between">
                    <span className="flex items-center">
                      <CalendarPlus className="mr-3 h-4 w-4" />
                      Schedule Training
                    </span>
                    <span>→</span>
                  </Button>
                </div>
              </Card>

              {/* Alerts & Notifications */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h3>
                <div className="space-y-4">
                  {expiringCerts.slice(0, 3).map((cert: any, index: number) => {
                    const expiryDate = cert.expiryDate ? new Date(cert.expiryDate) : null;
                    const isExpired = expiryDate ? expiryDate <= new Date() : false;
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-start space-x-3 p-3 border rounded-lg ${
                          isExpired 
                            ? 'bg-red-100 border-red-300' 
                            : 'bg-amber-50 border-amber-200'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          isExpired ? 'bg-red-600' : 'bg-amber-600'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {cert.worker.nameOfWorkers}'s {cert.name} {isExpired ? 'has expired' : 'expires soon'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {expiryDate ? expiryDate.toLocaleDateString('en-GB') : 'No expiry date'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {expiringCerts.length === 0 && (
                    <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-2 h-2 bg-secondary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">All certifications current</p>
                        <p className="text-xs text-gray-600">No expiring certifications</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Data Import/Export Section */}
          <Card className="mt-8 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Excel Import */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => setShowWorkerForm(true)}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-primary text-xl" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Import Worker Data</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Upload Excel file with worker information and course details
                </p>
                <Button className="bg-primary hover:bg-blue-700">
                  Choose File
                </Button>
              </div>

              {/* Export Options */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Export Options</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    onClick={handleExportData}
                  >
                    <span className="flex items-center">
                      <Users className="mr-3 h-4 w-4 text-gray-500" />
                      All Workers Data
                    </span>
                    <Download className="h-4 w-4 text-gray-400" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center">
                      <Tag className="mr-3 h-4 w-4 text-gray-500" />
                      Certifications Report
                    </span>
                    <Download className="h-4 w-4 text-gray-400" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center">
                      <GraduationCap className="mr-3 h-4 w-4 text-gray-500" />
                      Training Records
                    </span>
                    <Download className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </main>
      </div>

      {selectedWorker && (
        <WorkerModal
          worker={selectedWorker}
          isOpen={!!selectedWorker}
          onClose={() => setSelectedWorker(null)}
          onEditWorker={(worker) => {
            setSelectedWorker(null);
            toast({
              title: "Edit Worker",
              description: "Worker editing functionality will be available in a future update.",
            });
          }}
          onAddCertification={(workerId) => {
            setSelectedWorker(null);
            toast({
              title: "Add Certification",
              description: "Add certification functionality will be available in a future update.",
            });
          }}
        />
      )}

      <WorkerForm 
        isOpen={showWorkerForm}
        onClose={() => setShowWorkerForm(false)}
      />

      {/* Permit Expiry Modal */}
      <Dialog open={showPermitModal} onOpenChange={setShowPermitModal}>
        <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {permitModalType === 'expiring' ? 'Workers with Permits Expiring Soon' : 'Workers with Expired Permits'}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {(() => {
              const filteredWorkers = getWorkersWithPermitStatus(permitModalType);
              return filteredWorkers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>Permit Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkers.map((worker) => {
                      const expiryDate = worker.dateOfExpiry ? new Date(worker.dateOfExpiry) : null;
                      const isExpired = expiryDate ? expiryDate <= new Date() : false;
                      
                      return (
                        <TableRow key={worker.id} className="cursor-pointer hover:bg-gray-50" onClick={() => {
                          setSelectedWorker(worker);
                          setShowPermitModal(false);
                        }}>
                          <TableCell>{worker.workersId}</TableCell>
                          <TableCell>{worker.nameOfWorkers}</TableCell>
                          <TableCell>{worker.designation || 'Not specified'}</TableCell>
                          <TableCell>{worker.nationality || 'Not specified'}</TableCell>
                          <TableCell>
                            {expiryDate ? expiryDate.toLocaleDateString('en-GB') : 'No expiry date'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                              {isExpired ? 'Expired' : 'Expiring Soon'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No workers found with {permitModalType === 'expiring' ? 'permits expiring soon' : 'expired permits'}.
                  </p>
                </div>
              );
            })()} 
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Dashboard;
