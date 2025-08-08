import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Plus, FileText, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import type { WorkerWithCertifications, Course } from "@shared/schema";

interface WorkerModalProps {
  worker: WorkerWithCertifications;
  isOpen: boolean;
  onClose: () => void;
  onEditWorker?: (worker: WorkerWithCertifications) => void;
  onAddCertification?: (workerId: string) => void;
}

const WorkerModal = ({ worker, isOpen, onClose, onEditWorker, onAddCertification }: WorkerModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddCertForm, setShowAddCertForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    nameOfWorkers: worker.nameOfWorkers,
    designation: worker.designation || '',
    contactNo: worker.contactNo || '',
    nationality: worker.nationality || '',
    wpNo: worker.wpNo || '',
    nricFinNo: worker.nricFinNo || '',
    dateOfExpiry: worker.dateOfExpiry ? new Date(worker.dateOfExpiry).toISOString().split('T')[0] : '',
    dateOfBirth: worker.dateOfBirth ? new Date(worker.dateOfBirth).toISOString().split('T')[0] : ''
  });
  const [certFormData, setCertFormData] = useState({
    courseId: '',
    certificateNumber: '',
    expiryDate: ''
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const updateWorkerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/workers/${worker.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update worker');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Worker details updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
      setShowEditForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update worker details",
        variant: "destructive",
      });
    },
  });

  const addCertificationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/certifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          workerId: worker.id,
          issuedDate: new Date(),
          status: 'active'
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to add certification');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Certification added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setShowAddCertForm(false);
      setCertFormData({ courseId: '', certificateNumber: '', expiryDate: '' });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add certification",
        variant: "destructive",
      });
    },
  });
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-secondary">Current</Badge>;
      case 'expiring_soon':
        return <Badge variant="secondary" className="bg-accent text-black">Expiring Soon</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  };

  const handleEditDetails = () => {
    setShowEditForm(true);
  };

  const handleUpdateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editFormData.nameOfWorkers) {
      toast({
        title: "Validation Error",
        description: "Worker name is required",
        variant: "destructive",
      });
      return;
    }

    const updateData = {
      ...editFormData,
      dateOfExpiry: editFormData.dateOfExpiry || null,
      dateOfBirth: editFormData.dateOfBirth || null,
    };

    updateWorkerMutation.mutate(updateData);
  };

  const handleAddCertification = () => {
    setShowAddCertForm(true);
  };

  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!certFormData.courseId || !certFormData.certificateNumber) {
      toast({
        title: "Validation Error",
        description: "Course and Certificate Number are required",
        variant: "destructive",
      });
      return;
    }

    const course = courses.find(c => c.id === certFormData.courseId);
    const certData = {
      courseId: certFormData.courseId,
      name: course?.name || '',
      certificateNumber: certFormData.certificateNumber,
      expiryDate: certFormData.expiryDate ? new Date(certFormData.expiryDate) : null,
    };

    addCertificationMutation.mutate(certData);
  };

  const handleGenerateReport = () => {
    const activeCerts = worker.certifications.filter(cert => cert.status === 'active');
    const expiringSoon = worker.certifications.filter(cert => cert.status === 'expiring_soon');
    const expired = worker.certifications.filter(cert => cert.status === 'expired');
    
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>Worker Report - ${worker.nameOfWorkers}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { border-bottom: 2px solid #ddd; padding-bottom: 20px; margin-bottom: 20px; }
            .worker-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section h3 { color: #2563eb; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .status-active { background-color: #d4edda; color: #155724; padding: 2px 8px; border-radius: 4px; }
            .status-expiring { background-color: #fff3cd; color: #856404; padding: 2px 8px; border-radius: 4px; }
            .status-expired { background-color: #f8d7da; color: #721c24; padding: 2px 8px; border-radius: 4px; }
            .summary-stats { display: flex; gap: 20px; margin: 20px 0; }
            .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; flex: 1; }
            .stat-number { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .print-date { text-align: right; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Worker Report</h1>
            <div class="print-date">Generated on: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()}</div>
          </div>
          
          <div class="worker-info">
            <h2>${worker.nameOfWorkers}</h2>
            <p><strong>Worker ID:</strong> ${worker.workersId}</p>
            <p><strong>Designation:</strong> ${worker.designation || 'Not specified'}</p>
            <p><strong>Contact:</strong> ${worker.contactNo || 'Not provided'}</p>
            <p><strong>Nationality:</strong> ${worker.nationality || 'Not provided'}</p>
            <p><strong>NRIC/Fin No:</strong> ${worker.nricFinNo || 'Not specified'}</p>
            <p><strong>Date of Birth:</strong> ${worker.dateOfBirth ? new Date(worker.dateOfBirth).toLocaleDateString('en-GB') : 'Not specified'}</p>
            <p><strong>Date of Expiry:</strong> ${worker.dateOfExpiry ? new Date(worker.dateOfExpiry).toLocaleDateString('en-GB') : 'Not specified'}</p>
          </div>
          
          <div class="summary-stats">
            <div class="stat-card">
              <div class="stat-number">${worker.certifications.length}</div>
              <div>Total Certifications</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${activeCerts.length}</div>
              <div>Active</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${expiringSoon.length}</div>
              <div>Expiring Soon</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${expired.length}</div>
              <div>Expired</div>
            </div>
          </div>
          
          <div class="section">
            <h3>Certifications Details</h3>
            ${worker.certifications.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Certification</th>
                    <th>Certificate No.</th>
                    <th>Issued Date</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${worker.certifications.map(cert => `
                    <tr>
                      <td>${cert.name}</td>
                      <td>${cert.certificateNumber || 'N/A'}</td>
                      <td>${cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString('en-GB') : 'Not set'}</td>
                      <td>${cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('en-GB') : 'No expiry'}</td>
                      <td><span class="status-${cert.status === 'active' ? 'active' : cert.status === 'expiring_soon' ? 'expiring' : 'expired'}">${cert.status.charAt(0).toUpperCase() + cert.status.slice(1).replace('_', ' ')}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>No certifications recorded for this worker.</p>'}
          </div>
        </body>
      </html>
    `;
    
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      
      toast({
        title: "Report Generated",
        description: `Worker report for ${worker.nameOfWorkers} has been generated.`,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        {/* Modal Header */}
        <DialogHeader className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-gray-700">
                {getInitials(worker.nameOfWorkers)}
              </span>
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {worker.nameOfWorkers}
              </DialogTitle>
              <p className="text-gray-600">
                {worker.designation} • ID: {worker.workersId}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Worker Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Details */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500">Contact No.</label>
                      <p className="font-medium">{worker.contactNo || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">Nationality</label>
                      <p className="font-medium">{worker.nationality || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">WP No.</label>
                      <p className="font-medium">{worker.wpNo || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">NRIC/Fin No.</label>
                      <p className="font-medium">{worker.nricFinNo || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">Date of Birth</label>
                      <p className="font-medium">
                        {worker.dateOfBirth ? new Date(worker.dateOfBirth).toLocaleDateString('en-GB') : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="text-gray-500">Date of Expiry</label>
                      <p className="font-medium">
                        {worker.dateOfExpiry ? new Date(worker.dateOfExpiry).toLocaleDateString('en-GB') : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Certifications */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Certifications</h3>
                <div className="space-y-3">
                  {worker.certifications.length > 0 ? (
                    worker.certifications.map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                            <FileText className="text-secondary h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{cert.name}</p>
                            <p className="text-sm text-gray-600">
                              Certificate: {cert.certificateNumber || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {cert.expiryDate 
                                ? `Valid until: ${new Date(cert.expiryDate).toLocaleDateString('en-GB')}`
                                : 'No expiry date'
                              }
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(cert.status)}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No certifications recorded</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
              <div className="space-y-2">
                <Button 
                  className="w-full bg-primary hover:bg-blue-700"
                  onClick={handleEditDetails}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Details
                </Button>
                <Button 
                  className="w-full bg-secondary hover:bg-green-700"
                  onClick={handleAddCertification}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Certification
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={handleGenerateReport}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>

              {/* Training Progress */}
              <Card className="mt-6">
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Training Progress</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Safety Training</span>
                        <span>100%</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Equipment Training</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Edit Worker Form */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Worker Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateWorker} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editName">Name *</Label>
                <Input
                  id="editName"
                  value={editFormData.nameOfWorkers}
                  onChange={(e) => setEditFormData({...editFormData, nameOfWorkers: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editDesignation">Designation</Label>
                <Input
                  id="editDesignation"
                  value={editFormData.designation}
                  onChange={(e) => setEditFormData({...editFormData, designation: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editContact">Contact No.</Label>
                <Input
                  id="editContact"
                  value={editFormData.contactNo}
                  onChange={(e) => setEditFormData({...editFormData, contactNo: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editNationality">Nationality</Label>
                <Input
                  id="editNationality"
                  value={editFormData.nationality}
                  onChange={(e) => setEditFormData({...editFormData, nationality: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editWpNo">WP No.</Label>
                <Input
                  id="editWpNo"
                  value={editFormData.wpNo}
                  onChange={(e) => setEditFormData({...editFormData, wpNo: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editNricFin">NRIC/FIN No.</Label>
                <Input
                  id="editNricFin"
                  value={editFormData.nricFinNo}
                  onChange={(e) => setEditFormData({...editFormData, nricFinNo: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editExpiry">Date of Expiry</Label>
                <Input
                  id="editExpiry"
                  type="date"
                  value={editFormData.dateOfExpiry}
                  onChange={(e) => setEditFormData({...editFormData, dateOfExpiry: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editBirth">Date of Birth</Label>
                <Input
                  id="editBirth"
                  type="date"
                  value={editFormData.dateOfBirth}
                  onChange={(e) => setEditFormData({...editFormData, dateOfBirth: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowEditForm(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateWorkerMutation.isPending}
                className="bg-primary hover:bg-blue-700"
              >
                {updateWorkerMutation.isPending ? "Updating..." : "Update Worker"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Certification Form */}
      <Dialog open={showAddCertForm} onOpenChange={setShowAddCertForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Certification for {worker.nameOfWorkers}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCert} className="space-y-4">
            <div>
              <Label htmlFor="courseSelect">Course *</Label>
              <Select onValueChange={(value) => setCertFormData({...certFormData, courseId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="certNumber">Certificate Number *</Label>
              <Input
                id="certNumber"
                value={certFormData.certificateNumber}
                onChange={(e) => setCertFormData({...certFormData, certificateNumber: e.target.value})}
                placeholder="Enter certificate number"
                required
              />
            </div>
            <div>
              <Label htmlFor="certExpiry">Certificate Expiry Date</Label>
              <Input
                id="certExpiry"
                type="date"
                value={certFormData.expiryDate}
                onChange={(e) => setCertFormData({...certFormData, expiryDate: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowAddCertForm(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addCertificationMutation.isPending}
                className="bg-secondary hover:bg-green-700"
              >
                {addCertificationMutation.isPending ? "Adding..." : "Add Certification"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default WorkerModal;
