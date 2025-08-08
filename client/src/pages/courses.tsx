import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Clock, Users, List, Printer } from "lucide-react";
import type { Course, WorkerWithCertifications, InsertCourse } from "@shared/schema";

const Courses = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showWorkersModal, setShowWorkersModal] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [courseFormData, setCourseFormData] = useState({
    name: "",
    description: "",
    duration: "",
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const { data: workers = [] } = useQuery<WorkerWithCertifications[]>({
    queryKey: ['/api/workers'],
  });

  const getWorkersForCourse = (courseId: string) => {
    return workers.filter(worker => 
      worker.certifications.some(cert => cert.courseId === courseId)
    );
  };

  const getEnrolledCount = (courseId: string) => {
    return getWorkersForCourse(courseId).length;
  };

  const handleListWorkers = (course: Course) => {
    setSelectedCourse(course);
    setShowWorkersModal(true);
  };

  const handlePrintWorkers = (course: Course) => {
    const courseWorkers = getWorkersForCourse(course.id);
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>Workers with ${course.name} Certification</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .print-date { margin-bottom: 20px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Workers with ${course.name} Certification</h1>
          <div class="print-date">Generated on: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()}</div>
          <div>Total Certified Workers: ${courseWorkers.length}</div>
          <table>
            <thead>
              <tr>
                <th>Worker ID</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Nationality</th>
                <th>Certificate No.</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${courseWorkers.map((worker) => {
                const certification = worker.certifications.find(cert => cert.courseId === course.id);
                return `
                  <tr>
                    <td>${worker.workersId}</td>
                    <td>${worker.nameOfWorkers}</td>
                    <td>${worker.designation || 'Not specified'}</td>
                    <td>${worker.nationality || 'Not specified'}</td>
                    <td>${certification?.certificateNumber || 'N/A'}</td>
                    <td>${certification?.expiryDate 
                      ? new Date(certification.expiryDate).toLocaleDateString('en-GB') 
                      : 'No expiry'
                    }</td>
                    <td>${certification?.status || 'Unknown'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const createCourseMutation = useMutation({
    mutationFn: async (data: InsertCourse) => {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create course');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      handleCloseCourseModal();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
    },
  });

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseFormData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Course name is required",
        variant: "destructive",
      });
      return;
    }

    const submitData: InsertCourse = {
      name: courseFormData.name.trim(),
      description: courseFormData.description.trim() || null,
      duration: courseFormData.duration ? parseInt(courseFormData.duration) : null,
      isActive: courseFormData.isActive
    };

    createCourseMutation.mutate(submitData);
  };

  const handleCloseCourseModal = () => {
    setCourseFormData({
      name: "",
      description: "",
      duration: "",
      isActive: true
    });
    setShowAddCourseModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Courses</h2>
            <p className="text-sm text-gray-600">Manage training courses and programs</p>
          </div>
          <Button 
            className="bg-primary hover:bg-blue-700"
            onClick={() => setShowAddCourseModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: Course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{course.name}</span>
                  <Badge variant={course.isActive ? "default" : "secondary"}>
                    {course.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  {course.description || "No description available"}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  {course.duration && (
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      {course.duration} hours
                    </div>
                  )}
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    {getEnrolledCount(course.id)} enrolled
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleListWorkers(course)}
                  >
                    <List className="mr-2 h-4 w-4" />
                    List of Workers
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {courses.length === 0 && (
          <Card className="p-8 text-center">
            <CardContent>
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Plus className="text-primary text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first training course.</p>
              <Button 
                className="bg-primary hover:bg-blue-700"
                onClick={() => setShowAddCourseModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Workers Modal */}
      {selectedCourse && (
        <Dialog open={showWorkersModal} onOpenChange={setShowWorkersModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Workers with {selectedCourse.name} Certification</DialogTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintWorkers(selectedCourse)}
                  className="flex items-center space-x-1"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </Button>
              </div>
            </DialogHeader>
            <div className="mt-4 max-h-96 overflow-y-auto">
              {(() => {
                const courseWorkers = getWorkersForCourse(selectedCourse.id);
                return courseWorkers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Worker ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Nationality</TableHead>
                        <TableHead>Certificate No.</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courseWorkers.map((worker) => {
                        const certification = worker.certifications.find(cert => cert.courseId === selectedCourse.id);
                        return (
                          <TableRow key={worker.id}>
                            <TableCell>{worker.workersId}</TableCell>
                            <TableCell>{worker.nameOfWorkers}</TableCell>
                            <TableCell>{worker.designation || 'Not specified'}</TableCell>
                            <TableCell>{worker.nationality || 'Not specified'}</TableCell>
                            <TableCell>{certification?.certificateNumber || 'N/A'}</TableCell>
                            <TableCell>
                              {certification?.expiryDate 
                                ? new Date(certification.expiryDate).toLocaleDateString('en-GB') 
                                : 'No expiry'
                              }
                            </TableCell>
                            <TableCell>
                              <Badge variant={certification?.status === 'active' ? 'default' : 'secondary'}>
                                {certification?.status || 'Unknown'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No workers have this certification yet.</p>
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Course Modal */}
      <Dialog open={showAddCourseModal} onOpenChange={handleCloseCourseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCourse} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="courseName">Course Name *</Label>
              <Input
                id="courseName"
                value={courseFormData.name}
                onChange={(e) => setCourseFormData({...courseFormData, name: e.target.value})}
                placeholder="Enter course name"
                required
              />
            </div>

            <div>
              <Label htmlFor="courseDescription">Description</Label>
              <Textarea
                id="courseDescription"
                value={courseFormData.description}
                onChange={(e) => setCourseFormData({...courseFormData, description: e.target.value})}
                placeholder="Enter course description (optional)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="courseDuration">Duration (hours)</Label>
              <Input
                id="courseDuration"
                type="number"
                min="1"
                value={courseFormData.duration}
                onChange={(e) => setCourseFormData({...courseFormData, duration: e.target.value})}
                placeholder="Enter duration in hours (optional)"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="courseActive"
                checked={courseFormData.isActive}
                onChange={(e) => setCourseFormData({...courseFormData, isActive: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="courseActive">Active course</Label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseCourseModal}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createCourseMutation.isPending}
                className="bg-primary hover:bg-blue-700"
              >
                {createCourseMutation.isPending ? "Creating..." : "Create Course"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Courses;
