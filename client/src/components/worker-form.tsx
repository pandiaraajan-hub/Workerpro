import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Users } from "lucide-react";
import type { Course } from "@shared/schema";

interface WorkerFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const WorkerForm = ({ isOpen, onClose }: WorkerFormProps) => {
  const [formData, setFormData] = useState({
    entity: "",
    serialNumber: "",
    workersId: "",
    nameOfWorkers: "",
    designation: "",
    contactNo: "",
    nationality: "",
    wpNo: "",
    nricFinNo: "",
    dateOfExpiry: "",
    dateOfBirth: "",
  });
  const [selectedCourses, setSelectedCourses] = useState<{
    courseId: string;
    certificateNumber: string;
    expiryDate: string;
  }[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const createWorkerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/workers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create worker');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Worker added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add worker",
        variant: "destructive",
      });
    },
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.workersId || !formData.nameOfWorkers) {
      toast({
        title: "Validation Error",
        description: "Workers ID and Name are required",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      worker: {
        ...formData,
        dateOfExpiry: formData.dateOfExpiry || null,
        dateOfBirth: formData.dateOfBirth || null,
      },
      certifications: selectedCourses.map(course => ({
        courseId: course.courseId,
        name: courses.find(c => c.id === course.courseId)?.name || '',
        certificateNumber: course.certificateNumber,
        expiryDate: course.expiryDate || null,
        issuedDate: new Date().toISOString(),
        status: 'active'
      }))
    };

    createWorkerMutation.mutate(submitData);
  };


  const handleClose = () => {
    setFormData({
      entity: "",
      serialNumber: "",
      workersId: "",
      nameOfWorkers: "",
      designation: "",
      contactNo: "",
      nationality: "",
      wpNo: "",
      nricFinNo: "",
      dateOfExpiry: "",
      dateOfBirth: "",
    });
    setSelectedCourses([]);
    setTempCourseData({ courseId: "", certificateNumber: "", expiryDate: "" });
    onClose();
  };

  const [tempCourseData, setTempCourseData] = useState({
    courseId: "",
    certificateNumber: "",
    expiryDate: ""
  });

  const addCourse = () => {
    if (tempCourseData.courseId && tempCourseData.certificateNumber) {
      const exists = selectedCourses.find(c => c.courseId === tempCourseData.courseId);
      if (!exists) {
        setSelectedCourses([...selectedCourses, { ...tempCourseData }]);
        setTempCourseData({ courseId: "", certificateNumber: "", expiryDate: "" });
      }
    }
  };

  const removeCourse = (courseId: string) => {
    setSelectedCourses(selectedCourses.filter(c => c.courseId !== courseId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Workers</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Manual Entry Form */}
          (
            <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="entity">Entity</Label>
              <Input
                id="entity"
                value={formData.entity}
                onChange={(e) => setFormData({...formData, entity: e.target.value})}
                placeholder="Enter entity"
              />
            </div>

            <div>
              <Label htmlFor="serialNumber">S/N</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                placeholder="Serial number"
              />
            </div>

            <div>
              <Label htmlFor="workersId">Workers ID *</Label>
              <Input
                id="workersId"
                value={formData.workersId}
                onChange={(e) => setFormData({...formData, workersId: e.target.value})}
                placeholder="Enter workers ID"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="nameOfWorkers">Name of Workers *</Label>
              <Input
                id="nameOfWorkers"
                value={formData.nameOfWorkers}
                onChange={(e) => setFormData({...formData, nameOfWorkers: e.target.value})}
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => setFormData({...formData, designation: e.target.value})}
                placeholder="Job designation"
              />
            </div>

            <div>
              <Label htmlFor="contactNo">Contact No.</Label>
              <Input
                id="contactNo"
                value={formData.contactNo}
                onChange={(e) => setFormData({...formData, contactNo: e.target.value})}
                placeholder="Phone number"
              />
            </div>

            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                placeholder="Nationality"
              />
            </div>

            <div>
              <Label htmlFor="wpNo">WP No.</Label>
              <Input
                id="wpNo"
                value={formData.wpNo}
                onChange={(e) => setFormData({...formData, wpNo: e.target.value})}
                placeholder="Work permit number"
              />
            </div>

            <div>
              <Label htmlFor="nricFinNo">NRIC / Fin No</Label>
              <Input
                id="nricFinNo"
                value={formData.nricFinNo}
                onChange={(e) => setFormData({...formData, nricFinNo: e.target.value})}
                placeholder="NRIC or FIN number"
              />
            </div>

            <div>
              <Label htmlFor="dateOfExpiry">Date of Expiry</Label>
              <Input
                id="dateOfExpiry"
                type="date"
                value={formData.dateOfExpiry}
                onChange={(e) => setFormData({...formData, dateOfExpiry: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
              />
            </div>
          </div>

          {/* Course Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Assign Courses</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="courseSelect">Select Course</Label>
                <Select onValueChange={(value) => setTempCourseData({...tempCourseData, courseId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a course" />
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
                <Label htmlFor="certificateNumber">Certificate Number</Label>
                <Input
                  id="certificateNumber"
                  value={tempCourseData.certificateNumber}
                  onChange={(e) => setTempCourseData({...tempCourseData, certificateNumber: e.target.value})}
                  placeholder="Enter certificate number"
                />
              </div>
              
              <div>
                <Label htmlFor="courseExpiryDate">Certificate Expiry Date</Label>
                <Input
                  id="courseExpiryDate"
                  type="date"
                  value={tempCourseData.expiryDate}
                  onChange={(e) => setTempCourseData({...tempCourseData, expiryDate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-start">
              <Button
                type="button"
                onClick={addCourse}
                disabled={!tempCourseData.courseId || !tempCourseData.certificateNumber}
                className="bg-secondary hover:bg-green-700"
              >
                Add Course
              </Button>
            </div>

            {selectedCourses.length > 0 && (
              <div>
                <Label>Selected Courses</Label>
                <div className="space-y-2 mt-2">
                  {selectedCourses.map((courseData, index) => {
                    const course = courses.find(c => c.id === courseData.courseId);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                        <div className="flex-1">
                          <div className="font-medium">{course?.name}</div>
                          <div className="text-sm text-gray-600">
                            Certificate: {courseData.certificateNumber}
                            {courseData.expiryDate && ` • Expires: ${new Date(courseData.expiryDate).toLocaleDateString('en-GB')}`}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCourse(courseData.courseId)}
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createWorkerMutation.isPending}
                className="bg-primary hover:bg-blue-700"
              >
                {createWorkerMutation.isPending ? "Adding..." : "Add Worker"}
              </Button>
            </div>
          </form>
          )
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkerForm;